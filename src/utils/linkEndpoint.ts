/**
 * Centralized endpoint resolution for links. Every place that needs to know
 * the world-space position of a link's from or to end calls these helpers,
 * so T-junction vs node logic is written ONCE.
 */

import type { DiagramNode, Link } from '../types';
import { getBestAnchor, anchorToWorld, getAnchors, type SolideMapping } from './anchors';
import { CELL } from './snap';

interface Point { x: number; y: number }

/**
 * Resolve the world position of one end of a link, with dynamic anchor
 * selection (the position shifts toward `target` for shape anchors).
 *
 * For node endpoints: calls getBestAnchor with the anchor index/offset.
 * For T-junction endpoints: computes the position on the host link's path.
 */
export function resolveEndpoint(
  link: Link,
  end: 'from' | 'to',
  target: Point,
  nodes: Map<string, DiagramNode>,
  links: Map<string, Link>,
  solideMapping: SolideMapping,
): Point {
  // T-junction endpoint?
  const hostLinkId = end === 'from' ? link.fromLinkId : link.toLinkId;
  const hostT = end === 'from' ? link.fromLinkT : link.toLinkT;
  if (hostLinkId && hostT !== undefined) {
    return resolveTJunctionPos(hostLinkId, hostT, nodes, links);
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
 * Resolve the world position of one end of a link using the pinned anchor
 * position (no dynamic target). Cheaper than resolveEndpoint — used when
 * the "other end" position isn't known yet (e.g. building a path for snap
 * detection or T-junction host resolution).
 */
export function resolveEndpointStatic(
  link: Link,
  end: 'from' | 'to',
  nodes: Map<string, DiagramNode>,
  links: Map<string, Link>,
): Point {
  const hostLinkId = end === 'from' ? link.fromLinkId : link.toLinkId;
  const hostT = end === 'from' ? link.fromLinkT : link.toLinkT;
  if (hostLinkId && hostT !== undefined) {
    return resolveTJunctionPos(hostLinkId, hostT, nodes, links);
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
 * Check whether a link endpoint is a T-junction (attached to another link).
 */
export function isTJunction(link: Link, end: 'from' | 'to'): boolean {
  return end === 'from'
    ? !!(link.fromLinkId && link.fromLinkT !== undefined)
    : !!(link.toLinkId && link.toLinkT !== undefined);
}

/**
 * Check whether a link endpoint has a valid target (node or host link exists).
 */
export function hasValidEndpoint(
  link: Link,
  end: 'from' | 'to',
  nodes: Map<string, DiagramNode>,
): boolean {
  if (isTJunction(link, end)) return true;
  const nodeId = end === 'from' ? link.fromNodeId : link.toNodeId;
  return nodes.has(nodeId);
}

// ---- internal ----

import { pointOnPolyline } from './linkPath';

function resolveTJunctionPos(
  hostLinkId: string,
  t: number,
  nodes: Map<string, DiagramNode>,
  links: Map<string, Link>,
): Point {
  const host = links.get(hostLinkId);
  if (!host) return { x: 0, y: 0 };
  // Build host path using static resolution (avoids infinite recursion for
  // chained T-junctions by only going one level deep).
  const hostFrom = resolveEndpointStatic(host, 'from', nodes, links);
  const hostTo = resolveEndpointStatic(host, 'to', nodes, links);
  const hostPath = [
    hostFrom,
    ...(host.midpoints || []).map((mp) => ({ x: mp.x * CELL, y: mp.y * CELL })),
    hostTo,
  ];
  return pointOnPolyline(hostPath, t);
}
