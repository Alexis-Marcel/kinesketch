import { Layer, Line } from 'react-konva';

const MINOR_GRID = 20;
const MAJOR_GRID = 40;

interface GridLayerProps {
  width: number;
  height: number;
  stageX: number;
  stageY: number;
  stageScale: number;
}

/**
 * Static (non-listening) grid layer drawn behind the diagram. Lines are
 * computed in world coordinates and clipped to the visible viewport plus a
 * pad so panning doesn't reveal the seams.
 */
export function GridLayer({ width, height, stageX, stageY, stageScale }: GridLayerProps) {
  const pad = MAJOR_GRID * 2;
  const startX = Math.floor((-stageX / stageScale) / MINOR_GRID) * MINOR_GRID - pad;
  const endX = Math.ceil((-stageX / stageScale + width / stageScale) / MINOR_GRID) * MINOR_GRID + pad;
  const startY = Math.floor((-stageY / stageScale) / MINOR_GRID) * MINOR_GRID - pad;
  const endY = Math.ceil((-stageY / stageScale + height / stageScale) / MINOR_GRID) * MINOR_GRID + pad;

  const lines: React.ReactNode[] = [];
  for (let x = startX; x <= endX; x += MINOR_GRID) {
    const isMajor = x % MAJOR_GRID === 0;
    lines.push(
      <Line
        key={`gv${x}`}
        points={[x, startY, x, endY]}
        stroke={isMajor ? '#d1d5db' : '#f0f0f0'}
        strokeWidth={(isMajor ? 0.6 : 0.3) / stageScale}
        listening={false}
      />
    );
  }
  for (let y = startY; y <= endY; y += MINOR_GRID) {
    const isMajor = y % MAJOR_GRID === 0;
    lines.push(
      <Line
        key={`gh${y}`}
        points={[startX, y, endX, y]}
        stroke={isMajor ? '#d1d5db' : '#f0f0f0'}
        strokeWidth={(isMajor ? 0.6 : 0.3) / stageScale}
        listening={false}
      />
    );
  }

  return (
    <Layer listening={false} name="grid-layer">
      {lines}
    </Layer>
  );
}
