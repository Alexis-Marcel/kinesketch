/**
 * Detect crossover (intersection) points between polylines so the
 * LinkRenderer can draw small arc bumps where two links cross without
 * being connected.
 */

interface Point { x: number; y: number }

export interface CrossoverInfo {
  /** World position of the crossing. */
  x: number;
  y: number;
  /** Index of the segment on the "bumped" link where the crossing occurs. */
  segmentIndex: number;
  /** Parameter t ∈ [0,1] along that segment. */
  t: number;
  /** Angle of the CROSSING link at the intersection (used to orient the bump perpendicular). */
  crossingAngle: number;
}

/**
 * Standard 2D segment-segment intersection. Returns (t1, t2) parameters
 * if segments (p1→p2) and (p3→p4) intersect (both t ∈ (ε, 1-ε) to
 * avoid endpoint touching), or null if they don't.
 */
function segmentIntersection(
  p1: Point, p2: Point, p3: Point, p4: Point
): { t1: number; t2: number } | null {
  const d1x = p2.x - p1.x, d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x, d2y = p4.y - p3.y;
  const denom = d1x * d2y - d1y * d2x;
  if (Math.abs(denom) < 1e-10) return null; // parallel

  const t1 = ((p3.x - p1.x) * d2y - (p3.y - p1.y) * d2x) / denom;
  const t2 = ((p3.x - p1.x) * d1y - (p3.y - p1.y) * d1x) / denom;

  const eps = 0.01;
  if (t1 <= eps || t1 >= 1 - eps || t2 <= eps || t2 >= 1 - eps) return null;
  return { t1, t2 };
}

/**
 * Given a set of link polylines (keyed by link ID), compute all pairwise
 * crossing points. Returns a Map where each key is a link ID and the
 * value is an array of crossover points ON that link (the "bumped" link).
 *
 * Convention: the link with the LOWER render-order index gets the bump
 * (it passes "under" the other). If `renderOrder` is not provided, all
 * links get bumps bidirectionally (caller can pick one side).
 */
export function detectCrossovers(
  linkPaths: Map<string, Point[]>,
  bumpedLinkIds?: Set<string>
): Map<string, CrossoverInfo[]> {
  const result = new Map<string, CrossoverInfo[]>();
  const entries = Array.from(linkPaths.entries());

  for (let a = 0; a < entries.length; a++) {
    for (let b = a + 1; b < entries.length; b++) {
      const [idA, ptsA] = entries[a];
      const [idB, ptsB] = entries[b];

      for (let i = 0; i < ptsA.length - 1; i++) {
        for (let j = 0; j < ptsB.length - 1; j++) {
          const hit = segmentIntersection(ptsA[i], ptsA[i + 1], ptsB[j], ptsB[j + 1]);
          if (!hit) continue;

          const ix = ptsA[i].x + hit.t1 * (ptsA[i + 1].x - ptsA[i].x);
          const iy = ptsA[i].y + hit.t1 * (ptsA[i + 1].y - ptsA[i].y);

          // Link A gets the bump (crosses under B). The bump arc is
          // oriented perpendicular to B's direction at the crossing.
          const crossAngleB = Math.atan2(
            ptsB[j + 1].y - ptsB[j].y,
            ptsB[j + 1].x - ptsB[j].x
          );
          const crossAngleA = Math.atan2(
            ptsA[i + 1].y - ptsA[i].y,
            ptsA[i + 1].x - ptsA[i].x
          );

          // Decide who gets the bump: if bumpedLinkIds is provided, only
          // those links get bumps. Otherwise link A (earlier in iteration).
          if (!bumpedLinkIds || bumpedLinkIds.has(idA)) {
            let arr = result.get(idA);
            if (!arr) { arr = []; result.set(idA, arr); }
            arr.push({ x: ix, y: iy, segmentIndex: i, t: hit.t1, crossingAngle: crossAngleB });
          }
          if (!bumpedLinkIds || bumpedLinkIds.has(idB)) {
            let arr = result.get(idB);
            if (!arr) { arr = []; result.set(idB, arr); }
            arr.push({ x: ix, y: iy, segmentIndex: j, t: hit.t2, crossingAngle: crossAngleA });
          }
        }
      }
    }
  }

  // Sort each link's crossovers by segment index then t (so they can be
  // processed in order when drawing the bumped polyline).
  for (const arr of result.values()) {
    arr.sort((a, b) => a.segmentIndex - b.segmentIndex || a.t - b.t);
  }

  return result;
}
