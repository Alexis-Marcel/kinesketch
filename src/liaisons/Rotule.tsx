import { Circle, Group, Line } from 'react-konva';
import { snap } from '../utils/snap';

interface RotuleProps {
  x: number;
  y: number;
  rotation: number;
  view?: number;
  selected: boolean;
  colorA?: string;
  colorB?: string;
  onSelect: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDblClick: () => void;
}

export function Rotule({ x, y, rotation, selected, colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: RotuleProps) {
  const r = 12;
  const strokeWidth = selected ? 2.5 : 2;

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onDblClick}
      onDragMove={(e) => {
        const sx = snap(e.target.x());
        const sy = snap(e.target.y());
        e.target.x(sx);
        e.target.y(sy);
        onDragMove(sx, sy);
      }}
      onDragEnd={(e) => {
        const sx = snap(e.target.x());
        const sy = snap(e.target.y());
        e.target.x(sx);
        e.target.y(sy);
        onDragEnd(sx, sy);
      }}
    >
      {/* Inner circle (A) + 3/4 outer circle opening right (B) */}
      <Circle radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
      <Line
        points={Array.from({ length: 25 }, (_, i) => {
          const a = Math.PI / 4 + (3 * Math.PI / 2) * i / 24;
          return [15 * Math.cos(a), 15 * Math.sin(a)];
        }).flat()}
        stroke={colorB}
        strokeWidth={strokeWidth}
      />
    </Group>
  );
}
