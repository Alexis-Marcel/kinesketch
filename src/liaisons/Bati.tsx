import { Group, Line } from 'react-konva';
import { snap } from '../utils/snap';

interface BatiProps {
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

export function Bati({ x, y, rotation,  onSelect, onDragMove, onDragEnd, onDblClick }: BatiProps) {
  const strokeWidth = 1.5;
  const color = '#374151';

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
      {/* Horizontal ground line */}
      <Line points={[-22, 0, 22, 0]} stroke={color} strokeWidth={strokeWidth} />
      {/* Diagonal hatching strokes (ISO 3952) */}
      {[-16, -10, -4, 2, 8, 14].map((offset) => (
        <Line
          key={offset}
          points={[offset, 0, offset - 7, 8]}
          stroke={color}
          strokeWidth={1.2}
        />
      ))}
    </Group>
  );
}
