import type Konva from 'konva';
import type { RefObject } from 'react';

export interface PNGExportOptions {
  includeGrid?: boolean;
  includeAxes?: boolean;
}

function getStageRef(): Konva.Stage | null {
  const ref = (window as unknown as Record<string, unknown>).__kineSketchStage as RefObject<Konva.Stage | null> | undefined;
  return ref?.current ?? null;
}

export function exportPNG(options?: PNGExportOptions) {
  const stage = getStageRef();
  if (!stage) return;

  const includeGrid = options?.includeGrid ?? false;
  const includeAxes = options?.includeAxes ?? false;

  // Hide layers as needed
  const gridLayer = stage.findOne('.grid-layer') as Konva.Layer | undefined;
  const axisLayer = stage.findOne('.axis-layer') as Konva.Layer | undefined;

  if (gridLayer && !includeGrid) gridLayer.visible(false);
  if (axisLayer && !includeAxes) axisLayer.visible(false);

  const dataURL = stage.toDataURL({ pixelRatio: 3, mimeType: 'image/png' });

  // Restore layers
  if (gridLayer && !includeGrid) gridLayer.visible(true);
  if (axisLayer && !includeAxes) axisLayer.visible(true);

  const link = document.createElement('a');
  link.download = 'schema-cinematique.png';
  link.href = dataURL;
  link.click();
}
