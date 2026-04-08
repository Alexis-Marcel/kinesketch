import type { DiagramNode, LiaisonType, LiaisonView } from '../types';

export interface AnchorPoint3D {
  x: number;
  y: number;
  z: number;
  side: 'A' | 'B';
}

/**
 * 3D anchor points in local coordinates of each liaison.
 * Matches the 3D geometry orientation (vue 1: along X, vue 2: along Z).
 */
const ANCHOR_TABLE_3D: Record<string, AnchorPoint3D[]> = {
  // Pivot vue 1: barre along X (A=bouts de barre), palier center (B)
  'pivot:1': [
    { x: -2.6, y: 0, z: 0, side: 'A' },
    { x: 2.6, y: 0, z: 0, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  // Pivot vue 2: along Z (A=bouts de barre), palier center (B)
  'pivot:2': [
    { x: 0, y: 0, z: -2.6, side: 'A' },
    { x: 0, y: 0, z: 2.6, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  // Pivot vue 3: along Y (cylindre vertical)
  'pivot:3': [
    { x: 0, y: -2.6, z: 0, side: 'A' },
    { x: 0, y: 2.6, z: 0, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  // Glissière: A=centre, B=bouts du rail
  'glissiere:1': [
    { x: 0, y: 0, z: 0, side: 'A' },
    { x: -3, y: 0, z: 0, side: 'B' },
    { x: 3, y: 0, z: 0, side: 'B' },
  ],
  'glissiere:2': [
    { x: 0, y: 0, z: 0, side: 'A' },
    { x: 0, y: 0, z: -3, side: 'B' },
    { x: 0, y: 0, z: 3, side: 'B' },
  ],
  // Pivot glissant: A=bouts de l'axe, B=centre palier
  'pivot_glissant:1': [
    { x: -2.6, y: 0, z: 0, side: 'A' },
    { x: 2.6, y: 0, z: 0, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  'pivot_glissant:2': [
    { x: 0, y: 0, z: -2.6, side: 'A' },
    { x: 0, y: 0, z: 2.6, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  // Rotule: A=bille centre, B=coupelle centre
  'rotule:1': [
    { x: 0, y: 0, z: 0, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  // Encastrement: centre unique
  'encastrement:1': [
    { x: 0, y: 0, z: 0, side: 'A' },
  ],
  // Hélicoïdale: A=bouts de tige, B=centre écrou
  'helicoidale:1': [
    { x: -2.5, y: 0, z: 0, side: 'A' },
    { x: 2.5, y: 0, z: 0, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  'helicoidale:2': [
    { x: 0, y: 0, z: -2.5, side: 'A' },
    { x: 0, y: 0, z: 2.5, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  // Rotule à doigt
  'rotule_doigt:1': [
    { x: 0, y: 0, z: 0, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  // Appui plan
  'appui_plan:1': [
    { x: 0, y: 0, z: 0, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  // Linéaire annulaire
  'lineaire_annulaire:1': [
    { x: 0, y: 0, z: 0, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  'lineaire_annulaire:2': [
    { x: 0, y: 0, z: 0, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  // Linéaire rectiligne
  'lineaire_rectiligne:1': [
    { x: 0, y: 0, z: 0, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  'lineaire_rectiligne:2': [
    { x: 0, y: 0, z: 0, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  // Ponctuelle
  'ponctuelle:1': [
    { x: 0, y: 0, z: 0, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  // Bâti
  'bati:1': [
    { x: 0, y: 0, z: 0, side: 'A' },
  ],
  // Engrenages — centres
  'engrenage_ext:1': [
    { x: 0, y: 0, z: 0, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  'engrenage_ext:2': [
    { x: 0, y: 0, z: 0, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  'engrenage_int:1': [
    { x: 0, y: 0, z: 0, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  'engrenage_int:2': [
    { x: 0, y: 0, z: 0, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  'engrenage_conique:1': [
    { x: 0, y: 0, z: 0, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
  'engrenage_conique:2': [
    { x: 0, y: 0, z: 0, side: 'A' },
    { x: 0, y: 0, z: 0, side: 'B' },
  ],
};

export function getAnchors3D(type: LiaisonType, view: LiaisonView): AnchorPoint3D[] {
  return ANCHOR_TABLE_3D[`${type}:${view}`] || [];
}

/** Transform a local 3D anchor to world coordinates given node position and rotation */
export function anchor3DToWorld(
  anchor: AnchorPoint3D,
  node: DiagramNode,
): { x: number; y: number; z: number } {
  const radX = (node.rotationX * Math.PI) / 180;
  const radY = (node.rotation * Math.PI) / 180;
  const radZ = (node.rotationY * Math.PI) / 180;

  // Apply Euler rotation YXZ (Three.js default)
  const cosX = Math.cos(radX), sinX = Math.sin(radX);
  const cosY = Math.cos(radY), sinY = Math.sin(radY);
  const cosZ = Math.cos(radZ), sinZ = Math.sin(radZ);

  let { x, y, z } = anchor;

  // Scale
  const s = node.scale ?? 1;
  x *= s; y *= s; z *= s;

  // Rotate Z
  const x1 = x * cosZ - y * sinZ;
  const y1 = x * sinZ + y * cosZ;
  const z1 = z;

  // Rotate X
  const x2 = x1;
  const y2 = y1 * cosX - z1 * sinX;
  const z2 = y1 * sinX + z1 * cosX;

  // Rotate Y
  const x3 = x2 * cosY + z2 * sinY;
  const y3 = y2;
  const z3 = -x2 * sinY + z2 * cosY;

  return {
    x: node.x + x3,
    y: node.y + y3,
    z: node.z + z3,
  };
}

/** Find the best anchor on a node closest to a target position */
export function getBestAnchor3D(
  node: DiagramNode,
  targetPos: { x: number; y: number; z: number },
  linkSolideId: string | null,
  solideMapping: { a: string | null; b: string | null },
  forcedAnchorIdx?: number,
): { x: number; y: number; z: number } {
  const anchors = getAnchors3D(node.type, node.view);

  if (forcedAnchorIdx !== undefined && forcedAnchorIdx < anchors.length) {
    return anchor3DToWorld(anchors[forcedAnchorIdx], node);
  }

  if (anchors.length === 0) {
    return { x: node.x, y: node.y, z: node.z };
  }

  // Filter by matching side
  let candidates = anchors;
  if (linkSolideId && solideMapping.a && solideMapping.b) {
    if (linkSolideId === solideMapping.a) {
      candidates = anchors.filter((a) => a.side === 'A');
    } else if (linkSolideId === solideMapping.b) {
      candidates = anchors.filter((a) => a.side === 'B');
    }
  }
  if (candidates.length === 0) candidates = anchors;

  // Find nearest
  let bestDist = Infinity;
  let bestPos = { x: node.x, y: node.y, z: node.z };
  for (const anchor of candidates) {
    const world = anchor3DToWorld(anchor, node);
    const dx = world.x - targetPos.x;
    const dy = world.y - targetPos.y;
    const dz = world.z - targetPos.z;
    const dist = dx * dx + dy * dy + dz * dz;
    if (dist < bestDist) {
      bestDist = dist;
      bestPos = world;
    }
  }
  return bestPos;
}
