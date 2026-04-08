/** Pixels per grid cell — used by 2D canvas to convert grid units to pixels */
export const CELL = 10;

/** Snap a value (in grid units) to the nearest integer grid cell */
export function snap(value: number): number {
  return Math.round(value);
}

/** Snap a pixel value to the nearest CELL boundary (returns pixels) — for Konva drag events */
export function snapPx(px: number): number {
  return Math.round(px / CELL) * CELL;
}
