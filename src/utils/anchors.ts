import type { AnchorOffset, DiagramNode, LiaisonType, LiaisonView } from '../types';
import { CELL } from './snap';

export type { AnchorOffset };

/**
 * Find the closest node to a world point, within `LiaisonBounds.halfDiag * scale + extra`
 * of its center. Used by the link tool to figure out which node to show
 * anchor markers / snap to. `excludeId` skips the source node so the link
 * doesn't snap back to itself.
 */
export function findNearestNode(
  nodes: Map<string, DiagramNode>,
  target: { x: number; y: number },
  extraRadius: number,
  excludeId: string | null | undefined,
  getBounds: (type: LiaisonType, view: LiaisonView) => { halfW: number; halfH: number }
): { node: DiagramNode; dist: number } | null {
  let best: { node: DiagramNode; dist: number } | null = null;
  for (const node of nodes.values()) {
    if (excludeId && node.id === excludeId) continue;
    const dx = target.x - node.x * CELL;
    const dy = target.y - node.y * CELL;
    const dist = Math.hypot(dx, dy);
    const bounds = getBounds(node.type, node.view);
    const nodeScale = node.scale ?? 1;
    const halfDiag = Math.hypot(bounds.halfW, bounds.halfH) * nodeScale;
    if (dist < halfDiag + extraRadius && (!best || dist < best.dist)) {
      best = { node, dist };
    }
  }
  return best;
}

/**
 * Shape extent for an anchor. Defaults to a point (zero extent). When the
 * anchor is a shape (e.g. a circle), links connecting to it project to the
 * nearest point on the shape rather than to the center, so a link can attach
 * anywhere on the perimeter.
 *
 * All shape coordinates are in the same local frame as `AnchorPoint.x/y`
 * (the node's local pixel space, before rotation/scale).
 */
export type AnchorShape =
  | { kind: 'point' }
  | { kind: 'circle'; r: number }
  /**
   * Arc — same as a circle anchor but the snap zone is restricted to the
   * angular interval [startAngle, endAngle] (radians, local frame, screen
   * convention: 0 = +x, π/2 = +y / down). Used for partial circles like the
   * rotule's 3/4 outer arc so the snap doesn't fall in the visual gap.
   */
  | { kind: 'arc'; r: number; startAngle: number; endAngle: number };

const TWO_PI = Math.PI * 2;

/**
 * Clamp an angle to the angular interval [startAngle, endAngle] of an arc.
 * If the angle falls inside the interval, returns it canonicalized; if it's
 * in the gap, returns whichever endpoint is angularly closer.
 */
function clampAngleToArc(angle: number, startAngle: number, endAngle: number): number {
  const span = ((endAngle - startAngle) % TWO_PI + TWO_PI) % TWO_PI;
  const rel = ((angle - startAngle) % TWO_PI + TWO_PI) % TWO_PI;
  if (rel <= span) return startAngle + rel;
  return TWO_PI - rel < rel - span ? startAngle : startAngle + span;
}

export interface AnchorPoint {
  /** Local x of the anchor center (point) or shape center. */
  x: number;
  /** Local y of the anchor center (point) or shape center. */
  y: number;
  side: 'A' | 'B';
  /** If true, links connecting to this anchor are rendered BEHIND the node (the node masks the link). */
  behind?: boolean;
  /** Optional shape extent. If absent, the anchor is a single point. */
  shape?: AnchorShape;
}

type AnchorKey = `${LiaisonType}:${LiaisonView}`;

const ANCHOR_TABLE: Partial<Record<AnchorKey, AnchorPoint[]>> = {
  // Pivot vue 1: tourillons (A) left/right, rectangle (B) top/bottom
  // Pivot vue 1: axe horizontal (A) dépassant les tourillons
  'pivot:1': [
    { x: -42, y: 0, side: 'A' },
    { x: 42, y: 0, side: 'A' },
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
  // Pivot vue 3: cylindre vertical cavalier — axe (A) au bout dépassant les tourillons
  'pivot:3': [
    { x: 0, y: -42, side: 'A' },
    { x: 0, y: 42, side: 'A' },
    { x: 0, y: 0, side: 'B', behind: true },
  ],
  // Glissière vue 1: rectangle (A) + axe (B) qui dépasse à gauche/droite
  'glissiere:1': [
    { x: 0, y: -11, side: 'A' },
    { x: 0, y: 11, side: 'A' },
    { x: -42, y: 0, side: 'B' },
    { x: 42, y: 0, side: 'B' },
  ],
  // Glissière vue 2: square (A) edges, cross (B) center
  'glissiere:2': [
    { x: 0, y: -10, side: 'A' },
    { x: 0, y: 10, side: 'A' },
    { x: -10, y: 0, side: 'A' },
    { x: 10, y: 0, side: 'A' },
    { x: 0, y: 0, side: 'B' },
  ],
  // Glissière vue 3: pavé droit en perspective propre. Même structure que
  // pivot vue 3 : 2 anchors aux bouts de l'axe + 1 au centre (behind, masqué
  // par la silhouette).
  'glissiere:3': [
    { x: 0, y: 0, side: 'A', behind: true },
    { x: 0, y: -40, side: 'B' },
    { x: 0, y: 40, side: 'B' },
  ],
  // Pivot glissant vue 1: axe horizontal (A) étendu comme le pivot, sans tourillons
  'pivot_glissant:1': [
    { x: -42, y: 0, side: 'A' },
    { x: 42, y: 0, side: 'A' },
    { x: 0, y: -11, side: 'B' },
    { x: 0, y: 11, side: 'B' },
  ],
  // Pivot glissant vue 2: circle (A) + dot (B) — anchors on circle edge
  // Pivot glissant vue 2: cercle vu de bout — A sur tout le périmètre,
  // B au centre (rendu derrière pour que le cercle masque le lien entrant).
  'pivot_glissant:2': [
    { x: 0, y: 0, side: 'A', shape: { kind: 'circle', r: 12 } },
    { x: 0, y: 0, side: 'B', behind: true },
  ],
  // Pivot glissant vue 3: cylindre vertical cavalier + axe (A) qui dépasse
  // - top: bout de l'axe au-dessus du cylindre
  // - bottom: bout de l'axe en dessous, behind (le cylindre masque la fin du lien)
  // - center: B au centre, behind
  'pivot_glissant:3': [
    { x: 0, y: -42, side: 'A' },
    { x: 0, y: 42, side: 'A', behind: true },
    { x: 0, y: 0, side: 'B', behind: true },
  ],
  // Rotule: center point (A), 3/4 outer arc (B) — link snaps along the arc only
  // (the gap on the right side is excluded). Angles match the arc drawn in
  // Rotule.tsx: π/4 → 7π/4 (270° span, opening to the right).
  'rotule:1': [
    { x: 0, y: 0, side: 'A' },
    { x: 0, y: 0, side: 'B', shape: { kind: 'arc', r: 15, startAngle: Math.PI / 4, endAngle: 7 * Math.PI / 4 } },
  ],
  // Encastrement: single line (A) center
  'encastrement:1': [
    { x: 0, y: 0, side: 'A' },
  ],
  // Hélicoïdale vue 1: rectangle + diagonal (A) — same as glissière
  'helicoidale:1': [
    { x: 0, y: -11, side: 'A' },
    { x: 0, y: 11, side: 'A' },
    { x: -32, y: 0, side: 'B' },
    { x: 32, y: 0, side: 'B' },
  ],
  // Hélicoïdale vue 2: outer circle (A) + inner semicircle (B) — anchors on circle edge
  'helicoidale:2': [
    { x: 0, y: -12, side: 'A' },
    { x: 0, y: 12, side: 'A' },
    { x: -12, y: 0, side: 'B' },
    { x: 12, y: 0, side: 'B' },
  ],
  // Hélicoïdale vue 3: cylindre vertical en perspective cavalière avec hélice
  'helicoidale:3': [
    { x: 0, y: -22, side: 'A' },
    { x: 0, y: 22, side: 'A', behind: true },
    { x: 0, y: 0, side: 'B', behind: true },
  ],
  // Rotule à doigt: same as rotule but with a small radial pin — same anchors.
  'rotule_doigt:1': [
    { x: 0, y: 0, side: 'A' },
    { x: 0, y: 0, side: 'B', shape: { kind: 'arc', r: 15, startAngle: Math.PI / 4, endAngle: 7 * Math.PI / 4 } },
  ],
  // Appui plan: two parallel lines — top line (A), bottom line (B)
  'appui_plan:1': [
    { x: 0, y: -3, side: 'A' },
    { x: 0, y: 3, side: 'B' },
  ],
  // Appui plan vue 2: visuellement identique à la vue 1 (mêmes anchors)
  'appui_plan:2': [
    { x: 0, y: -3, side: 'A' },
    { x: 0, y: 3, side: 'B' },
  ],
  // Appui plan vue 3: deux losanges en perspective cavalière
  // A = centre du losange du haut (devant)
  // B = centre du losange du bas (derrière, masqué par celui du haut)
  'appui_plan:3': [
    { x: 0, y: -4, side: 'A' },
    { x: 0, y: 4, side: 'B', behind: true },
  ],
  // Linéaire annulaire vue 1: circle (A) top, rectangle (B) bottom
  'lineaire_annulaire:1': [
    { x: 0, y: -14, side: 'A' },
    { x: 0, y: 14, side: 'B' },
  ],
  // Linéaire annulaire vue 2: circle (A) top, semicircle (B) bottom
  'lineaire_annulaire:2': [
    { x: 0, y: -12, side: 'A' },
    { x: 0, y: 15, side: 'B' },
  ],
  // Linéaire annulaire vue 3: demi-cylindre horizontal + sphère à l'intérieur
  'lineaire_annulaire:3': [
    { x: 4, y: 1, side: 'A' },
    { x: 0, y: 0, side: 'B', behind: true },
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
  // Linéaire rectiligne vue 3: perspective cavalière
  // A = centre du parallélogramme de la face du dessus du cylindre
  // B = centre du losange du plan (le link passe derrière le losange)
  'lineaire_rectiligne:3': [
    { x: 0, y: -7, side: 'A' },
    { x: 0, y: 5, side: 'B', behind: true },
  ],
  // Ponctuelle: circle (A) top, line (B) bottom
  'ponctuelle:1': [
    { x: 0, y: -12, side: 'A' },
    { x: 0, y: 12, side: 'B' },
  ],
  // Ponctuelle vue 2: visuellement identique à la vue 1 (mêmes anchors)
  'ponctuelle:2': [
    { x: 0, y: -12, side: 'A' },
    { x: 0, y: 12, side: 'B' },
  ],
  // Ponctuelle vue 3: cercle (A) au-dessus + losange (B) en perspective cavalière
  // Anchor A légèrement au-dessus du centre de la sphère
  'ponctuelle:3': [
    { x: 0, y: -13, side: 'A' },
    { x: 0, y: 5, side: 'B', behind: true },
  ],
  // Bâti: single anchor on top
  'bati:1': [
    { x: 0, y: -4, side: 'A' },
  ],
  // Engrenage extérieur vue 1: center of small gear (A), center of big gear (B)
  'engrenage_ext:1': [
    { x: 0, y: -48, side: 'A' },
    { x: 0, y: 32, side: 'B' },
  ],
  // Engrenage extérieur vue 2: small circle (A), big circle (B) — links snap anywhere on the perimeter
  'engrenage_ext:2': [
    { x: 0, y: -58, side: 'A', shape: { kind: 'circle', r: 34 } },
    { x: 0, y: 34, side: 'B', shape: { kind: 'circle', r: 58 } },
  ],
  // Engrenage intérieur vue 1: A between lines 1&2 on left, B center of right vertical (hook)
  'engrenage_int:1': [
    { x: -12, y: -40, side: 'A' },
    { x: 24, y: 0, side: 'B' },
  ],
  // Engrenage intérieur vue 2: small circle (A) inside big circle (B) — both circular
  'engrenage_int:2': [
    { x: 0, y: -34, side: 'A', shape: { kind: 'circle', r: 24 } },
    { x: 0, y: 0, side: 'B', shape: { kind: 'circle', r: 58 } },
  ],
  // Engrenage conique vue 1
  'engrenage_conique:1': [
    { x: 0, y: -40, side: 'A' },
    { x: -40, y: 0, side: 'B' },
  ],
  // Engrenage conique vue 2: circle (A) — link snaps on the perimeter; vertical bar (B) is a point
  'engrenage_conique:2': [
    { x: 0, y: 0, side: 'A', shape: { kind: 'circle', r: 58 } },
    { x: -58, y: 0, side: 'B' },
  ],
  // Roue et vis sans fin vue 1: wheel circle (A) — link snaps anywhere on the
  // perimeter; midpoint of the vertical worm shaft (B) — point anchor.
  'roue_vis_sans_fin:1': [
    { x: 0, y: -62, side: 'A', shape: { kind: 'circle', r: 20 } },
    { x: 0, y: 21, side: 'B' },
  ],
  // Roue et vis sans fin vue 2: big wheel circle (A) — link snaps anywhere on
  // the perimeter; rectangle center (B) — point anchor, rendered BEHIND so the
  // rectangle masks the incoming link.
  'roue_vis_sans_fin:2': [
    { x: 0, y: 17, side: 'A', shape: { kind: 'circle', r: 58 } },
    { x: 0, y: -58, side: 'B', behind: true },
  ],
  // Transmission par poulie courroie vue 1: small left pulley (A) + larger
  // right pulley (B). Anchors at the center of each pulley's horizontal bar
  // (which sits at y=-9 after the bbox shift).
  'transmission_poulie_courroie:1': [
    { x: -90, y: -9, side: 'A' },
    { x: 66, y: -9, side: 'B' },
  ],
  // Transmission par poulie courroie vue 2: two pulley circles connected by a
  // belt. Both anchors are circle shapes so the link can attach anywhere on
  // the perimeter. Diameters and spacing match the view-1 bars/gap.
  // cxSmall = -90, cxBig = 66 (with r1=36, r2=60, G=60).
  'transmission_poulie_courroie:2': [
    { x: -90, y: 0, side: 'A', shape: { kind: 'circle', r: 36 } },
    { x: 66, y: 0, side: 'B', shape: { kind: 'circle', r: 60 } },
  ],
  // Transmission par pignons et chaîne — same layout as poulie courroie but
  // view 1 has arrows (no caps) and the chain is dashed at the same y.
  'transmission_pignons_chaine:1': [
    { x: -90, y: 0, side: 'A' },
    { x: 66, y: 0, side: 'B' },
  ],
  'transmission_pignons_chaine:2': [
    { x: -90, y: 0, side: 'A', shape: { kind: 'circle', r: 36 } },
    { x: 66, y: 0, side: 'B', shape: { kind: 'circle', r: 60 } },
  ],
};

export function getAnchors(type: LiaisonType, view: LiaisonView): AnchorPoint[] {
  return ANCHOR_TABLE[`${type}:${view}`] ?? [];
}

export function anchorToWorld(
  anchor: AnchorPoint,
  nodeX: number,
  nodeY: number,
  rotationDeg: number,
  scale: number = 1
): { x: number; y: number } {
  const rad = (rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const sx = anchor.x * scale;
  const sy = anchor.y * scale;
  return {
    x: nodeX + sx * cos - sy * sin,
    y: nodeY + sx * sin + sy * cos,
  };
}

/** Inverse of the local→world transform: world point → node-local pixel coords. */
function worldToLocal(
  worldX: number,
  worldY: number,
  nodeX: number,
  nodeY: number,
  rotationDeg: number,
  scale: number
): { x: number; y: number } {
  const rad = -(rotationDeg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = worldX - nodeX;
  const dy = worldY - nodeY;
  return {
    x: (dx * cos - dy * sin) / scale,
    y: (dx * sin + dy * cos) / scale,
  };
}

/**
 * Given a click world position on a shape anchor, capture the offset that
 * pins the attachment to that exact spot. Returns undefined for non-shape
 * anchors (point anchors don't need an offset — they have only one position).
 */
export function computeAnchorOffsetFromWorld(
  anchor: AnchorPoint,
  node: DiagramNode,
  worldPos: { x: number; y: number }
): AnchorOffset | undefined {
  const shape = anchor.shape ?? { kind: 'point' as const };
  if (shape.kind === 'point') return undefined;
  const local = worldToLocal(
    worldPos.x,
    worldPos.y,
    node.x * CELL,
    node.y * CELL,
    node.rotation,
    node.scale ?? 1
  );
  let angle = Math.atan2(local.y - anchor.y, local.x - anchor.x);
  if (shape.kind === 'arc') {
    angle = clampAngleToArc(angle, shape.startAngle, shape.endAngle);
  }
  return { kind: 'circle', angle };
}

/**
 * Apply a stored offset to an anchor and return the world position. Returns
 * null if the offset is incompatible with the anchor's current shape (e.g.
 * the anchor was redefined).
 */
export function applyAnchorOffset(
  anchor: AnchorPoint,
  node: DiagramNode,
  offset: AnchorOffset
): { x: number; y: number } | null {
  const shape = anchor.shape ?? { kind: 'point' as const };
  if (shape.kind === 'point' || offset.kind !== 'circle') return null;
  const scale = node.scale ?? 1;
  const angle = shape.kind === 'arc'
    ? clampAngleToArc(offset.angle, shape.startAngle, shape.endAngle)
    : offset.angle;
  // Local point on the perimeter
  const lx = anchor.x + shape.r * Math.cos(angle);
  const ly = anchor.y + shape.r * Math.sin(angle);
  // Local → world (reuses anchorToWorld math by passing a synthetic anchor)
  return anchorToWorld({ x: lx, y: ly, side: anchor.side }, node.x * CELL, node.y * CELL, node.rotation, scale);
}

/**
 * Project a target world position onto an anchor shape, returning the actual
 * point a link should connect to. For point anchors, this is just the anchor
 * world position. For circle anchors, it's the point on the perimeter closest
 * to the target.
 */
export function projectAnchorToTarget(
  anchor: AnchorPoint,
  nodeX: number,
  nodeY: number,
  rotationDeg: number,
  scale: number,
  target: { x: number; y: number }
): { x: number; y: number } {
  const center = anchorToWorld(anchor, nodeX, nodeY, rotationDeg, scale);
  const shape = anchor.shape ?? { kind: 'point' };
  if (shape.kind === 'point') return center;

  const r = shape.r * scale;
  const dx = target.x - center.x;
  const dy = target.y - center.y;
  const d = Math.hypot(dx, dy);
  if (d < 1e-6) return center;

  if (shape.kind === 'circle') {
    return { x: center.x + (dx / d) * r, y: center.y + (dy / d) * r };
  }
  // Arc — clamp the projection's angle in the local frame so it stays on the
  // visible portion of the perimeter even when the cursor is in the gap.
  const rotRad = (rotationDeg * Math.PI) / 180;
  const worldAngle = Math.atan2(dy, dx);
  const localAngle = clampAngleToArc(worldAngle - rotRad, shape.startAngle, shape.endAngle);
  const finalAngle = localAngle + rotRad;
  return { x: center.x + Math.cos(finalAngle) * r, y: center.y + Math.sin(finalAngle) * r };
}

/**
 * Distance from a target world point to the *shape* of an anchor — not its
 * center. Used to pick the nearest anchor among candidates: a target sitting
 * on the perimeter of a circle anchor should report distance ≈ 0 even if the
 * circle's center is far away.
 */
function distanceToAnchorShape(
  anchor: AnchorPoint,
  nodeX: number,
  nodeY: number,
  rotationDeg: number,
  scale: number,
  target: { x: number; y: number }
): number {
  const shape = anchor.shape ?? { kind: 'point' };
  if (shape.kind === 'point') {
    const center = anchorToWorld(anchor, nodeX, nodeY, rotationDeg, scale);
    return Math.hypot(target.x - center.x, target.y - center.y);
  }
  // For circle / arc, the closest point on the visible portion is what
  // projectAnchorToTarget returns — so distance to the *shape* is just the
  // euclidean distance from target to that projected point.
  const projected = projectAnchorToTarget(anchor, nodeX, nodeY, rotationDeg, scale, target);
  return Math.hypot(target.x - projected.x, target.y - projected.y);
}

/** Within this distance (px, world coords), a point anchor wins over any shape anchor. */
const POINT_ANCHOR_PRIORITY_RADIUS = 30;

/**
 * Pick the index of the anchor closest to `target` among `anchors`. Point
 * anchors are preferred over shape anchors when within
 * POINT_ANCHOR_PRIORITY_RADIUS — discrete points should always win over
 * continuous shapes when the cursor is reasonably close to one.
 */
function pickAnchorIdx(
  anchors: AnchorPoint[],
  nodeX: number,
  nodeY: number,
  rotationDeg: number,
  scale: number,
  target: { x: number; y: number }
): number {
  let bestPointIdx = -1;
  let bestPointDist = Infinity;
  let bestAnyIdx = 0;
  let bestAnyDist = Infinity;
  for (let i = 0; i < anchors.length; i++) {
    const a = anchors[i];
    const d = distanceToAnchorShape(a, nodeX, nodeY, rotationDeg, scale, target);
    const isPoint = !a.shape || a.shape.kind === 'point';
    if (d < bestAnyDist) {
      bestAnyDist = d;
      bestAnyIdx = i;
    }
    if (isPoint && d < bestPointDist) {
      bestPointDist = d;
      bestPointIdx = i;
    }
  }
  if (bestPointIdx >= 0 && bestPointDist <= POINT_ANCHOR_PRIORITY_RADIUS) {
    return bestPointIdx;
  }
  return bestAnyIdx;
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
  return anchorToWorld(anchors[anchorIdx], node.x * CELL, node.y * CELL, node.rotation, node.scale ?? 1);
}

/**
 * Pick the anchor on `node` whose shape is closest to `target` (a world point,
 * typically the cursor), and return both the anchor index and the projected
 * point on that anchor's shape. Also returns the captured offset for shape
 * anchors so the caller can pin the link at this exact spot on commit.
 */
export function pickNearestAnchor(
  node: DiagramNode,
  target: { x: number; y: number }
): { idx: number; pos: { x: number; y: number }; offset?: AnchorOffset } | null {
  const anchors = getAnchors(node.type, node.view);
  if (anchors.length === 0) return null;
  const nodePx = node.x * CELL;
  const nodePy = node.y * CELL;
  const rot = node.rotation;
  const scl = node.scale ?? 1;
  const bestIdx = pickAnchorIdx(anchors, nodePx, nodePy, rot, scl, target);
  const bestAnchor = anchors[bestIdx];
  const pos = projectAnchorToTarget(bestAnchor, nodePx, nodePy, rot, scl, target);
  const offset = computeAnchorOffsetFromWorld(bestAnchor, node, pos);
  return { idx: bestIdx, pos, offset };
}

export function getBestAnchor(
  node: DiagramNode,
  targetPos: { x: number; y: number },
  linkSolideId: string | null,
  solideMapping: SolideMapping,
  forcedAnchorIdx?: number,
  forcedOffset?: AnchorOffset
): { x: number; y: number } {
  const nodePx = node.x * CELL;
  const nodePy = node.y * CELL;
  const rot = node.rotation;
  const scl = node.scale ?? 1;

  // If a specific anchor is pinned, honor it. With a stored offset, use the
  // exact captured spot on the shape; otherwise, project the shape toward the
  // target (dynamic snap, current default).
  if (forcedAnchorIdx !== undefined) {
    const all = getAnchors(node.type, node.view);
    const pinned = all[forcedAnchorIdx];
    if (pinned) {
      if (forcedOffset) {
        const fixed = applyAnchorOffset(pinned, node, forcedOffset);
        if (fixed) return fixed;
      }
      return projectAnchorToTarget(pinned, nodePx, nodePy, rot, scl, targetPos);
    }
  }

  const anchors = getAnchors(node.type, node.view);
  if (anchors.length === 0) {
    return { x: nodePx, y: nodePy };
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

  // Pick the anchor whose SHAPE is closest to the target, then project to it.
  // Point anchors take precedence over shape anchors when reasonably close.
  const bestIdxIn = pickAnchorIdx(candidates, nodePx, nodePy, rot, scl, targetPos);
  const bestAnchor = candidates[bestIdxIn];
  return projectAnchorToTarget(bestAnchor, nodePx, nodePy, rot, scl, targetPos);
}
