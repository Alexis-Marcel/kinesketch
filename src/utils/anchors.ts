import type { DiagramNode, LiaisonType, LiaisonView } from '../types';

export interface AnchorPoint {
  x: number;
  y: number;
  side: 'A' | 'B';
}

const ANCHOR_TABLE: Record<string, AnchorPoint[]> = {
  // Pivot vue 1: flanges (A) left/right, rectangle (B) top/bottom
  'pivot:1': [
    { x: -34, y: 0, side: 'A' },
    { x: 34, y: 0, side: 'A' },
    { x: 0, y: -11, side: 'B' },
    { x: 0, y: 11, side: 'B' },
  ],
  // Pivot vue 2: simple circle (A) — anchors on circle edge
  'pivot:2': [
    { x: 0, y: -12, side: 'A' },
    { x: 0, y: 12, side: 'A' },
    { x: -12, y: 0, side: 'A' },
    { x: 12, y: 0, side: 'A' },
  ],
  // Glissière vue 1: simple rectangle — top/bottom (A), sides (B)
  'glissiere:1': [
    { x: 0, y: -11, side: 'A' },
    { x: 0, y: 11, side: 'A' },
    { x: -22, y: 0, side: 'B' },
    { x: 22, y: 0, side: 'B' },
  ],
  // Glissière vue 2: square (A) edges, cross (B) center
  'glissiere:2': [
    { x: 0, y: -10, side: 'A' },
    { x: 0, y: 10, side: 'A' },
    { x: -10, y: 0, side: 'A' },
    { x: 10, y: 0, side: 'A' },
    { x: 0, y: 0, side: 'B' },
  ],
  // Pivot glissant vue 1: shaft (A) left/right, rectangle (B) top/bottom
  'pivot_glissant:1': [
    { x: -22, y: 0, side: 'A' },
    { x: 22, y: 0, side: 'A' },
    { x: 0, y: -11, side: 'B' },
    { x: 0, y: 11, side: 'B' },
  ],
  // Pivot glissant vue 2: circle (A) + dot (B) — anchors on circle edge
  'pivot_glissant:2': [
    { x: 0, y: -12, side: 'A' },
    { x: 0, y: 12, side: 'A' },
    { x: -12, y: 0, side: 'B' },
    { x: 12, y: 0, side: 'B' },
  ],
  // Rotule: inner circle (A) right, 3/4 outer circle (B) left
  'rotule:1': [
    { x: 12, y: 0, side: 'A' },
    { x: -15, y: 0, side: 'B' },
  ],
  // Encastrement: single line (A) center
  'encastrement:1': [
    { x: 0, y: 0, side: 'A' },
  ],
  // Hélicoïdale vue 1: rectangle + diagonal (A) — same as glissière
  'helicoidale:1': [
    { x: 0, y: -11, side: 'A' },
    { x: 0, y: 11, side: 'A' },
    { x: -22, y: 0, side: 'B' },
    { x: 22, y: 0, side: 'B' },
  ],
  // Hélicoïdale vue 2: outer circle (A) + inner semicircle (B) — anchors on circle edge
  'helicoidale:2': [
    { x: 0, y: -12, side: 'A' },
    { x: 0, y: 12, side: 'A' },
    { x: -12, y: 0, side: 'B' },
    { x: 12, y: 0, side: 'B' },
  ],
  // Rotule à doigt: inner circle+doigt (A) right, 3/4 outer circle (B) left
  'rotule_doigt:1': [
    { x: 12, y: 0, side: 'A' },
    { x: -15, y: 0, side: 'B' },
  ],
  // Appui plan: two parallel lines — top line (A), bottom line (B)
  'appui_plan:1': [
    { x: 0, y: -3, side: 'A' },
    { x: 0, y: 3, side: 'B' },
  ],
  // Linéaire annulaire vue 1: circle (A) top, rectangle (B) bottom
  'lineaire_annulaire:1': [
    { x: 0, y: -18, side: 'A' },
    { x: 0, y: 10, side: 'B' },
  ],
  // Linéaire annulaire vue 2: circle (A) top, semicircle (B) bottom
  'lineaire_annulaire:2': [
    { x: 0, y: -12, side: 'A' },
    { x: 0, y: 15, side: 'B' },
  ],
  // Linéaire rectiligne vue 1: trapezoid (A) top, line (B) bottom
  'lineaire_rectiligne:1': [
    { x: 0, y: -11, side: 'A' },
    { x: 0, y: 11, side: 'B' },
  ],
  // Linéaire rectiligne vue 2: triangle (A) top, lines (B) top/bottom
  'lineaire_rectiligne:2': [
    { x: 0, y: -11, side: 'A' },
    { x: 0, y: 11, side: 'B' },
  ],
  // Ponctuelle: circle (A) top, line (B) bottom
  'ponctuelle:1': [
    { x: 0, y: -12, side: 'A' },
    { x: 0, y: 12, side: 'B' },
  ],
};

export function getAnchors(type: LiaisonType, view: LiaisonView): AnchorPoint[] {
  return ANCHOR_TABLE[`${type}:${view}`] || [];
}

export function anchorToWorld(
  anchor: AnchorPoint,
  nodeX: number,
  nodeY: number,
  rotationDeg: number
): { x: number; y: number } {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: nodeX + anchor.x * cos - anchor.y * sin,
    y: nodeY + anchor.x * sin + anchor.y * cos,
  };
}

export interface SolideMapping {
  a: string | null;
  b: string | null;
}

export function getAnchorWorldByIndex(
  node: DiagramNode,
  anchorIdx: number
): { x: number; y: number } | null {
  const anchors = getAnchors(node.type, node.view);
  if (anchorIdx < 0 || anchorIdx >= anchors.length) return null;
  return anchorToWorld(anchors[anchorIdx], node.x, node.y, node.rotation);
}

export function getBestAnchor(
  node: DiagramNode,
  targetPos: { x: number; y: number },
  linkSolideId: string | null,
  solideMapping: SolideMapping,
  forcedAnchorIdx?: number
): { x: number; y: number } {
  // If a specific anchor is pinned, use it directly
  if (forcedAnchorIdx !== undefined) {
    const pinned = getAnchorWorldByIndex(node, forcedAnchorIdx);
    if (pinned) return pinned;
  }

  const anchors = getAnchors(node.type, node.view);
  if (anchors.length === 0) {
    return { x: node.x, y: node.y };
  }

  // Filter by matching side if possible
  let candidates = anchors;
  if (linkSolideId && solideMapping.a && solideMapping.b) {
    if (linkSolideId === solideMapping.a) {
      candidates = anchors.filter((a) => a.side === 'A');
    } else if (linkSolideId === solideMapping.b) {
      candidates = anchors.filter((a) => a.side === 'B');
    }
  }
  if (candidates.length === 0) {
    candidates = anchors;
  }

  // Find nearest anchor to target
  let bestDist = Infinity;
  let bestPos = { x: node.x, y: node.y };
  for (const anchor of candidates) {
    const world = anchorToWorld(anchor, node.x, node.y, node.rotation);
    const dx = world.x - targetPos.x;
    const dy = world.y - targetPos.y;
    const dist = dx * dx + dy * dy;
    if (dist < bestDist) {
      bestDist = dist;
      bestPos = world;
    }
  }
  return bestPos;
}
