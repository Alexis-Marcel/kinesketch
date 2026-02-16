import { Circle, Group, Line } from 'react-konva';
import { snap } from '../utils/snap';

interface PivotProps {
  x: number;
  y: number;
  rotation: number;
  selected: boolean;
  onSelect: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDblClick: () => void;
}

export function Pivot({ x, y, rotation, selected, onSelect, onDragMove, onDragEnd, onDblClick }: PivotProps) {
  const r = 12;
  const strokeColor = selected ? '#2563eb' : '#1a1a1a';
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
      <Circle radius={r} stroke={strokeColor} strokeWidth={strokeWidth} fill="white" />
      <Line points={[-r - 8, 0, r + 8, 0]} stroke={strokeColor} strokeWidth={strokeWidth} />
      <Circle radius={2.5} fill={strokeColor} />
    </Group>
  );
}
