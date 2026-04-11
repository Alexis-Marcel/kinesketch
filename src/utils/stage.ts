/**
 * Convert a Konva pointer position (in screen pixels) to world coordinates
 * given the current stage transform (pan + zoom).
 */
export function pointerToWorld(
  pointer: { x: number; y: number },
  stageX: number,
  stageY: number,
  stageScale: number
): { x: number; y: number } {
  return {
    x: (pointer.x - stageX) / stageScale,
    y: (pointer.y - stageY) / stageScale,
  };
}
