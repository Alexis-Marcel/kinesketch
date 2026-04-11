import type Konva from 'konva';
import { snapPx, CELL } from './snap';

/**
 * Build Konva drag handlers that snap to the pixel grid and report
 * positions in grid units (the LiaisonNode wrapper does the same for nodes;
 * frames and angle arcs use this helper directly because they don't go
 * through LiaisonNode).
 */
export function makeSnapDragHandlers(
  onDragMove: (gx: number, gy: number) => void,
  onDragEnd: (gx: number, gy: number) => void
) {
  const apply = (e: Konva.KonvaEventObject<DragEvent>, cb: (gx: number, gy: number) => void) => {
    const sx = snapPx(e.target.x());
    const sy = snapPx(e.target.y());
    e.target.x(sx);
    e.target.y(sy);
    cb(sx / CELL, sy / CELL);
  };
  return {
    onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => apply(e, onDragMove),
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => apply(e, onDragEnd),
  };
}
