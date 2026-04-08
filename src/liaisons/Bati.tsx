import { Group, Line } from 'react-konva';
import { snapPx } from '../utils/snap';
import { HitRect } from './HitRect';

interface BatiProps {
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

export function Bati({ x, y, rotation, scale = 1, view = 1, colorA = '#374151', onSelect, onDragMove, onDragEnd, onDblClick }: BatiProps) {
  const strokeWidth = 1.5;
  const color = colorA;

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
      <HitRect type="bati" view={view} />
      {/* Horizontal ground line */}
      <Line points={[-22, -4, 22, -4]} stroke={color} strokeWidth={strokeWidth} />
      {/* Diagonal hatching strokes (ISO 3952) */}
      {[-16, -10, -4, 2, 8, 14].map((offset) => (
        <Line
          key={offset}
          points={[offset, -4, offset - 7, 4]}
          stroke={color}
          strokeWidth={1.2}
        />
      ))}
    </Group>
  );
}
