/**
 * Single-pass link path resolver. Computes the full rendered polyline for
 * every link, handling T-junction dependencies via topological sort so there
 * is ZERO recursion. The result is a cache that every consumer reads from:
 * LinkRenderer, snap detection, ghost lines, endpoint dots.
 */

import type { DiagramNode, Link } from '../types';
import { getBestAnchor, anchorToWorld, getAnchors, type SolideMapping } from './anchors';
import { CELL } from './snap';
import { computeOrthoRoute } from './orthoRouter';

interface Point { x: number; y: number }

/**
 * Resolve one endpoint of a link to a world position, using the path cache
 * for T-junction lookups (no recursion).
 */
function resolveEnd(
  link: Link,
  end: 'from' | 'to',
  target: Point,
  nodes: Map<string, DiagramNode>,
  solideMapping: SolideMapping,
  cache: Map<string, Point[]>,
): Point {
  const hostLinkId = end === 'from' ? link.fromLinkId : link.toLinkId;
  const hostT = end === 'from' ? link.fromLinkT : link.toLinkT;

  // T-junction: look up the host path in the cache
  if (hostLinkId && hostT !== undefined) {
    const hostPath = cache.get(hostLinkId);
    if (hostPath && hostPath.length >= 2) {
      return pointOnPath(hostPath, hostT);
    }
    return { x: 0, y: 0 };
  }

  // Node endpoint
  const nodeId = end === 'from' ? link.fromNodeId : link.toNodeId;
  const anchorIdx = end === 'from' ? link.fromAnchorIdx : link.toAnchorIdx;
  const anchorOffset = end === 'from' ? link.fromAnchorOffset : link.toAnchorOffset;
  const node = nodes.get(nodeId);
  if (!node) return { x: 0, y: 0 };
  return getBestAnchor(node, target, link.solideId, solideMapping, anchorIdx, anchorOffset);
}

/**
 * Quick static endpoint resolution (for first-pass targets when the
 * opposite anchor position isn't known yet).
 */
function resolveEndStatic(
  link: Link,
  end: 'from' | 'to',
  nodes: Map<string, DiagramNode>,
  cache: Map<string, Point[]>,
): Point {
  const hostLinkId = end === 'from' ? link.fromLinkId : link.toLinkId;
  const hostT = end === 'from' ? link.fromLinkT : link.toLinkT;

  if (hostLinkId && hostT !== undefined) {
    const hostPath = cache.get(hostLinkId);
    if (hostPath && hostPath.length >= 2) {
      return pointOnPath(hostPath, hostT);
    }
    return { x: 0, y: 0 };
  }

  const nodeId = end === 'from' ? link.fromNodeId : link.toNodeId;
  const anchorIdx = end === 'from' ? link.fromAnchorIdx : link.toAnchorIdx;
  const node = nodes.get(nodeId);
  if (!node) return { x: 0, y: 0 };

  if (anchorIdx !== undefined) {
    const anchors = getAnchors(node.type, node.view);
    if (anchors[anchorIdx]) {
      return anchorToWorld(anchors[anchorIdx], node.x * CELL, node.y * CELL, node.rotation, node.scale ?? 1);
    }
  }
  return { x: node.x * CELL, y: node.y * CELL };
}

/**
 * Compute the full path for a single link (two-pass anchor resolution +
 * optional ortho routing). Reads T-junction positions from the cache.
 */
function resolveSingleLinkPath(
  link: Link,
  nodes: Map<string, DiagramNode>,
  allNodes: Map<string, DiagramNode>,
  fromMapping: SolideMapping,
  toMapping: SolideMapping,
  cache: Map<string, Point[]>,
): Point[] {
  const midpointsPx = (link.midpoints || []).map((mp) => ({ x: mp.x * CELL, y: mp.y * CELL }));

  // Two-pass anchor resolution: first with approximate targets, then refined.
  const toCenter = resolveEndStatic(link, 'to', nodes, cache);
  const fromCenter = resolveEndStatic(link, 'from', nodes, cache);

  const fromInit = resolveEnd(link, 'from', midpointsPx[0] ?? toCenter, nodes, fromMapping, cache);
  const toInit = resolveEnd(link, 'to', midpointsPx[midpointsPx.length - 1] ?? fromCenter, nodes, toMapping, cache);
  const fromFinal = resolveEnd(link, 'from', midpointsPx[0] ?? toInit, nodes, fromMapping, cache);
  const toFinal = resolveEnd(link, 'to', midpointsPx[midpointsPx.length - 1] ?? fromInit, nodes, toMapping, cache);

  // Ortho routing (A* with obstacle avoidance)
  const routingMode = link.routingMode ?? 'direct';
  if (routingMode !== 'direct') {
    const excludeIds = new Set([link.fromNodeId, link.toNodeId].filter(Boolean));
    const autoCorners = computeOrthoRoute(fromFinal, toFinal, routingMode, allNodes, excludeIds);
    return [fromFinal, ...autoCorners, toFinal];
  }

  return [fromFinal, ...midpointsPx, toFinal];
}

/**
 * Resolve ALL link paths in one pass via topological sort. Links that
 * depend on other links (T-junctions) are resolved AFTER their hosts,
 * reading positions from the cache instead of recursing.
 *
 * Returns a Map of linkId → full rendered polyline (world pixels).
 */
export function resolveAllLinkPaths(
  links: Map<string, Link>,
  nodes: Map<string, DiagramNode>,
  nodeSolideMapping: Map<string, SolideMapping>,
): Map<string, Point[]> {
  const cache = new Map<string, Point[]>();
  const pending = new Map(links);
  const defaultMapping: SolideMapping = { a: null, b: null };

  // Topological sort: keep resolving links whose T-junction hosts
  // are already in the cache. Repeat until no progress.
  let changed = true;
  while (changed && pending.size > 0) {
    changed = false;
    for (const [id, link] of pending) {
      const fromReady = !link.fromLinkId || cache.has(link.fromLinkId);
      const toReady = !link.toLinkId || cache.has(link.toLinkId);
      if (fromReady && toReady) {
        const fromMapping = nodeSolideMapping.get(link.fromNodeId) || defaultMapping;
        const toMapping = nodeSolideMapping.get(link.toNodeId) || defaultMapping;
        cache.set(id, resolveSingleLinkPath(link, nodes, nodes, fromMapping, toMapping, cache));
        pending.delete(id);
        changed = true;
      }
    }
  }

  // Circular deps — resolve with node centers as fallback
  for (const [id, link] of pending) {
    const fromMapping = nodeSolideMapping.get(link.fromNodeId) || defaultMapping;
    const toMapping = nodeSolideMapping.get(link.toNodeId) || defaultMapping;
    cache.set(id, resolveSingleLinkPath(link, nodes, nodes, fromMapping, toMapping, cache));
    // cache now has this link (with (0,0) for unresolved T-junction hosts)
  }

  return cache;
}

// ---- Internal: point on polyline (same as linkPath.ts but avoids circular dep) ----

function pointOnPath(points: Point[], t: number): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1 || t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];

  let total = 0;
  const cumul = [0];
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    cumul.push(total);
  }
  if (total === 0) return points[0];
  const target = t * total;
  for (let i = 1; i < points.length; i++) {
    if (cumul[i] >= target) {
      const segLen = cumul[i] - cumul[i - 1];
      if (segLen < 1e-6) return points[i - 1];
      const lt = (target - cumul[i - 1]) / segLen;
      return {
        x: points[i - 1].x + lt * (points[i].x - points[i - 1].x),
        y: points[i - 1].y + lt * (points[i].y - points[i - 1].y),
      };
    }
  }
  return points[points.length - 1];
}
