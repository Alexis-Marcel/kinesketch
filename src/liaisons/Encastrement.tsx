import { Group, Line } from 'react-konva';
import { snapPx } from '../utils/snap';
import { HitRect } from './HitRect';

interface EncastrementProps {
  x: number;
  y: number;
  rotation: number;
  scale?: number;
  view?: number;
  selected: boolean;
  colorA?: string;
  colorB?: string;
  onSelect: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDblClick: () => void;
}

export function Encastrement({ x, y, rotation, scale = 1, view = 1, colorA = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: EncastrementProps) {
  const strokeWidth = 1.5;

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation} scaleX={scale} scaleY={scale}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onDblClick}
      onDragMove={(e) => {
        const sx = snapPx(e.target.x());
        const sy = snapPx(e.target.y());
        e.target.x(sx);
        e.target.y(sy);
        onDragMove(sx, sy);
      }}
      onDragEnd={(e) => {
        const sx = snapPx(e.target.x());
        const sy = snapPx(e.target.y());
        e.target.x(sx);
        e.target.y(sy);
        onDragEnd(sx, sy);
      }}
    >
      <HitRect type="encastrement" view={view} />
      {/* Single horizontal line (A) */}
      <Line points={[-32, 0, 32, 0]} stroke={colorA} strokeWidth={strokeWidth} />
    </Group>
  );
}
