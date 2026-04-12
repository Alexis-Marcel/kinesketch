import type { DiagramNode, LinkRoutingMode } from '../types';
import { getLiaisonBounds } from '../liaisons/bounds';
import { CELL } from './snap';

/**
 * A* orthogonal router. Finds a shortest-path route between two world-space
 * points on a grid, avoiding node bounding boxes. Returns an array of
 * intermediate corner points (in pixels, world space) — the caller still
 * needs to prepend/append the actual anchor positions.
 *
 * Two routing modes:
 * - 'ortho'      : horizontal + vertical segments
 * - 'ortho-persp': perspective-horizontal (cavalier diagonal) + vertical
 */

interface Point { x: number; y: number }

const GRID = CELL; // grid cell size for A* (matches the snap grid)
const TURN_COST = 2; // extra cost per direction change (discourages zig-zag)

// Quantize a pixel coordinate to a grid cell index
function toGrid(v: number): number {
  return Math.round(v / GRID);
}

// Grid cell index back to pixel coordinate
function toWorld(g: number): number {
  return g * GRID;
}

/**
 * Build the set of blocked grid cells from node bounding boxes. Each node's
 * axis-aligned bounding box (in world coords) is rasterized onto the grid
 * with a 1-cell padding so routes don't hug node edges.
 */
function buildObstacles(
  nodes: Map<string, DiagramNode>,
  excludeIds: Set<string>
): Set<number> {
  const blocked = new Set<number>();
  const pad = 2; // cells of padding around each node

  for (const node of nodes.values()) {
    if (excludeIds.has(node.id)) continue;
    const bounds = getLiaisonBounds(node.type, node.view);
    const scale = node.scale ?? 1;
    const cx = toGrid(node.x * CELL);
    const cy = toGrid(node.y * CELL);
    const hw = Math.ceil((bounds.halfW * scale) / GRID) + pad;
    const hh = Math.ceil((bounds.halfH * scale) / GRID) + pad;

    for (let gx = cx - hw; gx <= cx + hw; gx++) {
      for (let gy = cy - hh; gy <= cy + hh; gy++) {
        blocked.add(packKey(gx, gy));
      }
    }
  }
  return blocked;
}

// Pack two grid coords into a single number for use as Map/Set key.
// Supports grid coords in [-16384, 16383] (15 bits each).
function packKey(gx: number, gy: number): number {
  return ((gx + 16384) << 15) | (gy + 16384);
}

/**
 * Directions for A* neighbors. For 'ortho' mode: 4 cardinal directions.
 * For 'ortho-persp': replace the 2 horizontal moves with cavalier-diagonal
 * moves (the "perspective horizontal" directions).
 */
function getDirections(mode: LinkRoutingMode): Array<{ dx: number; dy: number; id: number }> {
  if (mode === 'ortho-persp') {
    // Cavalier perspective: "horizontal" follows the depth axis direction.
    // Standard cavalier at 30° with 1:1 scale: for every 2 cells right,
    // go 1 cell up. Approximated as (2, -1) and (-2, 1).
    return [
      { dx: 0, dy: -1, id: 0 }, // up (vertical)
      { dx: 0, dy: 1, id: 1 },  // down (vertical)
      { dx: 2, dy: -1, id: 2 }, // perspective-right (cavalier diagonal)
      { dx: -2, dy: 1, id: 3 }, // perspective-left (cavalier diagonal)
    ];
  }
  return [
    { dx: 0, dy: -1, id: 0 }, // up
    { dx: 0, dy: 1, id: 1 },  // down
    { dx: 1, dy: 0, id: 2 },  // right
    { dx: -1, dy: 0, id: 3 }, // left
  ];
}

/**
 * Heuristic for A*. Manhattan distance for ortho, adapted for ortho-persp.
 */
function heuristic(
  ax: number, ay: number,
  bx: number, by: number,
  mode: LinkRoutingMode
): number {
  if (mode === 'ortho-persp') {
    // The perspective-horizontal moves cover (2, -1) per step. Decompose
    // the displacement into vertical + perspective-horizontal moves.
    const dxAbs = Math.abs(bx - ax);
    const dyAbs = Math.abs(by - ay);
    // Each persp-H step covers 2 in x and 1 in y. We need dxAbs/2 such
    // steps, each also covering 1 in y. Remaining vertical = dyAbs - dxAbs/2.
    const perspSteps = Math.floor(dxAbs / 2);
    const remainY = Math.max(0, dyAbs - perspSteps);
    return perspSteps + remainY + dxAbs % 2;
  }
  return Math.abs(bx - ax) + Math.abs(by - ay);
}

/** Minimal binary heap for A* open set. */
class MinHeap {
  private data: Array<{ key: number; f: number }> = [];

  push(key: number, f: number) {
    this.data.push({ key, f });
    this.bubbleUp(this.data.length - 1);
  }

  pop(): number {
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return top.key;
  }

  get size() { return this.data.length; }

  private bubbleUp(i: number) {
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.data[parent].f <= this.data[i].f) break;
      [this.data[parent], this.data[i]] = [this.data[i], this.data[parent]];
      i = parent;
    }
  }

  private sinkDown(i: number) {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this.data[l].f < this.data[smallest].f) smallest = l;
      if (r < n && this.data[r].f < this.data[smallest].f) smallest = r;
      if (smallest === i) break;
      [this.data[smallest], this.data[i]] = [this.data[i], this.data[smallest]];
      i = smallest;
    }
  }
}

/**
 * Run A* and return the list of corner points (in world pixels) between
 * `from` and `to`. Returns an empty array if no route is found (fallback
 * to a simple L-shape) or if the path is a straight line.
 */
export function computeOrthoRoute(
  from: Point,
  to: Point,
  mode: LinkRoutingMode,
  nodes: Map<string, DiagramNode>,
  excludeNodeIds: Set<string>,
): Point[] {
  if (mode === 'direct') return [];

  const sx = toGrid(from.x), sy = toGrid(from.y);
  const ex = toGrid(to.x), ey = toGrid(to.y);
  if (sx === ex && sy === ey) return [];

  const obstacles = buildObstacles(nodes, excludeNodeIds);
  const dirs = getDirections(mode);

  // A* search
  const gScore = new Map<number, number>();
  const cameFrom = new Map<number, number>();
  const dirUsed = new Map<number, number>(); // which direction was used to reach each cell
  const startKey = packKey(sx, sy);
  const endKey = packKey(ex, ey);

  gScore.set(startKey, 0);
  const open = new MinHeap();
  open.push(startKey, heuristic(sx, sy, ex, ey, mode));

  let found = false;
  const maxIterations = 50000; // safety cap
  let iterations = 0;

  while (open.size > 0 && iterations < maxIterations) {
    iterations++;
    const currentKey = open.pop();
    if (currentKey === endKey) { found = true; break; }

    const currentG = gScore.get(currentKey)!;
    const cx = ((currentKey >> 15) & 0x7FFF) - 16384;
    const cy = (currentKey & 0x7FFF) - 16384;
    const currentDir = dirUsed.get(currentKey);

    for (const dir of dirs) {
      const nx = cx + dir.dx;
      const ny = cy + dir.dy;
      const nKey = packKey(nx, ny);

      // Allow start and end cells even if "blocked" (they're inside nodes)
      if (nKey !== endKey && obstacles.has(nKey)) continue;

      // Cost: 1 per step + turn penalty
      const turnPenalty = (currentDir !== undefined && currentDir !== dir.id) ? TURN_COST : 0;
      const tentativeG = currentG + 1 + turnPenalty;

      const prevG = gScore.get(nKey);
      if (prevG !== undefined && tentativeG >= prevG) continue;

      gScore.set(nKey, tentativeG);
      cameFrom.set(nKey, currentKey);
      dirUsed.set(nKey, dir.id);
      open.push(nKey, tentativeG + heuristic(nx, ny, ex, ey, mode));
    }
  }

  if (!found) {
    // Fallback: simple L-shape (one midpoint)
    return fallbackLShape(from, to, mode);
  }

  // Reconstruct path
  const path: Array<{ gx: number; gy: number }> = [];
  let key = endKey;
  while (key !== startKey) {
    const gx = ((key >> 15) & 0x7FFF) - 16384;
    const gy = (key & 0x7FFF) - 16384;
    path.push({ gx, gy });
    key = cameFrom.get(key)!;
  }
  path.reverse();

  // Simplify: keep only corner points (where direction changes)
  const corners: Point[] = [];
  let prevDx = path.length > 0 ? path[0].gx - sx : 0;
  let prevDy = path.length > 0 ? path[0].gy - sy : 0;

  for (let i = 1; i < path.length; i++) {
    const dx = path[i].gx - path[i - 1].gx;
    const dy = path[i].gy - path[i - 1].gy;
    if (dx !== prevDx || dy !== prevDy) {
      corners.push({ x: toWorld(path[i - 1].gx), y: toWorld(path[i - 1].gy) });
      prevDx = dx;
      prevDy = dy;
    }
  }

  return corners;
}

/**
 * Simple L-shape fallback when A* fails or times out. Returns 1 midpoint
 * that creates a right-angle bend.
 */
function fallbackLShape(from: Point, to: Point, mode: LinkRoutingMode): Point[] {
  if (mode === 'ortho-persp') {
    // Perspective L: go vertical first, then perspective-horizontal
    return [{ x: from.x, y: to.y }];
  }
  // Ortho L: go horizontal first, then vertical
  return [{ x: to.x, y: from.y }];
}
