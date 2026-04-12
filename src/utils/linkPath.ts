/**
 * Utilities for computing positions along a polyline path. Used by T-junction
 * links to resolve where a link end attaches to another link's path.
 */

import type { DiagramNode, Link } from '../types';
import { CELL } from './snap';
import { resolveEndpointStatic } from './linkEndpoint';

interface Point { x: number; y: number }

/**
 * Build the approximate world-space polyline for a link using resolved
 * anchor positions (not node centers). Handles both node endpoints and
 * T-junction endpoints via resolveEndpointStatic. Used for T-junction
 * snap detection AND for rendering T-junction attachment points.
 */
export function buildLinkPath(
  link: Link,
  nodes: Map<string, DiagramNode>,
  links?: Map<string, Link>
): Point[] {
  const emptyLinks = new Map<string, Link>();
  const lks = links ?? emptyLinks;
  return [
    resolveEndpointStatic(link, 'from', nodes, lks),
    ...(link.midpoints || []).map((mp) => ({ x: mp.x * CELL, y: mp.y * CELL })),
    resolveEndpointStatic(link, 'to', nodes, lks),
  ];
}

/**
 * Compute the total arc-length of a polyline and the cumulative length
 * at each vertex.
 */
function cumulativeLengths(points: Point[]): { total: number; cumul: number[] } {
  const cumul = [0];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    cumul.push(total);
  }
  return { total, cumul };
}

/**
 * Given a polyline and a parameter `t ∈ [0, 1]` (normalized arc-length),
 * return the interpolated world position on the polyline.
 */
export function pointOnPolyline(points: Point[], t: number): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  if (points.length === 1 || t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];

  const { total, cumul } = cumulativeLengths(points);
  const target = t * total;

  for (let i = 1; i < points.length; i++) {
    if (cumul[i] >= target) {
      const segLen = cumul[i] - cumul[i - 1];
      if (segLen < 1e-6) return points[i - 1];
      const localT = (target - cumul[i - 1]) / segLen;
      return {
        x: points[i - 1].x + localT * (points[i].x - points[i - 1].x),
        y: points[i - 1].y + localT * (points[i].y - points[i - 1].y),
      };
    }
  }
  return points[points.length - 1];
}

/**
 * Project a world point onto the nearest position on a polyline. Returns
 * the parameter `t ∈ [0, 1]` and the projected position. Used when the
 * user clicks on a link to create a T-junction endpoint.
 */
export function projectOntoPolyline(
  points: Point[],
  target: Point
): { t: number; pos: Point; dist: number } {
  if (points.length < 2) {
    const p = points[0] ?? { x: 0, y: 0 };
    return { t: 0, pos: p, dist: Math.hypot(target.x - p.x, target.y - p.y) };
  }

  const { total, cumul } = cumulativeLengths(points);
  let bestT = 0;
  let bestPos = points[0];
  let bestDist = Infinity;

  for (let i = 0; i < points.length - 1; i++) {
    const ax = points[i].x, ay = points[i].y;
    const bx = points[i + 1].x, by = points[i + 1].y;
    const dx = bx - ax, dy = by - ay;
    const segLen = Math.hypot(dx, dy);
    if (segLen < 1e-6) continue;

    // Project target onto segment [a, b]
    let localT = ((target.x - ax) * dx + (target.y - ay) * dy) / (segLen * segLen);
    localT = Math.max(0, Math.min(1, localT));

    const px = ax + localT * dx;
    const py = ay + localT * dy;
    const dist = Math.hypot(target.x - px, target.y - py);

    if (dist < bestDist) {
      bestDist = dist;
      bestPos = { x: px, y: py };
      bestT = total > 0 ? (cumul[i] + localT * (cumul[i + 1] - cumul[i])) / total : 0;
    }
  }

  return { t: bestT, pos: bestPos, dist: bestDist };
}
