import type { Link } from '../types';

/**
 * For each node, the set of solide IDs that connect through it (a liaison
 * binds two or more solides via the links pinned at its anchors).
 *
 * Used by mobility analysis (Grübler) and the liaison graph view.
 */
export function buildNodeSolidesMap(links: Map<string, Link>): Map<string, Set<string>> {
  const result = new Map<string, Set<string>>();
  for (const link of links.values()) {
    let from = result.get(link.fromNodeId);
    if (!from) {
      from = new Set();
      result.set(link.fromNodeId, from);
    }
    from.add(link.solideId);

    let to = result.get(link.toNodeId);
    if (!to) {
      to = new Set();
      result.set(link.toNodeId, to);
    }
    to.add(link.solideId);
  }
  return result;
}
