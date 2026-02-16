import type Konva from 'konva';
import type { RefObject } from 'react';

function getStageRef(): Konva.Stage | null {
  const ref = (window as unknown as Record<string, unknown>).__kineSketchStage as RefObject<Konva.Stage | null> | undefined;
  return ref?.current ?? null;
}

export function exportPNG() {
  const stage = getStageRef();
  if (!stage) return;

  const dataURL = stage.toDataURL({ pixelRatio: 3, mimeType: 'image/png' });
  const link = document.createElement('a');
  link.download = 'schema-cinematique.png';
  link.href = dataURL;
  link.click();
}
