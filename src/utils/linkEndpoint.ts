/**
 * Light helpers for checking link endpoint validity. The actual position
 * resolution is done by linkPathResolver.ts (single-pass, no recursion).
 */

import type { DiagramNode, Link } from '../types';

/**
 * Check whether a link endpoint has a valid target (node exists, or it's
 * a T-junction with a host link ID set).
 */
export function hasValidEndpoint(
  link: Link,
  end: 'from' | 'to',
  nodes: Map<string, DiagramNode>,
): boolean {
  const hostLinkId = end === 'from' ? link.fromLinkId : link.toLinkId;
  const hostT = end === 'from' ? link.fromLinkT : link.toLinkT;
  if (hostLinkId && hostT !== undefined) return true;
  const nodeId = end === 'from' ? link.fromNodeId : link.toNodeId;
  return nodes.has(nodeId);
}
