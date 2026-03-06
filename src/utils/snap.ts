export const SNAP_SIZE = 10;

export function snap(value: number): number {
  return Math.round(value / SNAP_SIZE) * SNAP_SIZE;
}
