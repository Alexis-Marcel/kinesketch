import { Circle, Group, Line } from 'react-konva';
import { snap } from '../utils/snap';

interface RotuleDoigtProps {
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

export function RotuleDoigt({ x, y, rotation, selected, colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: RotuleDoigtProps) {
  const r = 12;
  const cos45 = Math.cos(Math.PI / 4);
  const sin45 = Math.sin(Math.PI / 4);
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
      {/* Inner circle (A) + 3/4 outer circle opening right (B) + doigt line (A) */}
      <Circle radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
      <Line
        points={Array.from({ length: 25 }, (_, i) => {
          const a = Math.PI / 4 + (3 * Math.PI / 2) * i / 24;
          return [15 * Math.cos(a), 15 * Math.sin(a)];
        }).flat()}
        stroke={colorB}
        strokeWidth={strokeWidth}
      />
      {/* Doigt: line from inner circle edge at lower-left, through outer circle */}
      <Line
        points={[-r * cos45, r * sin45, -20 * cos45, 20 * sin45]}
        stroke={colorA}
        strokeWidth={strokeWidth}
      />
    </Group>
  );
}
