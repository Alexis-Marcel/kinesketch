import { Circle, Group, Line } from 'react-konva';
import { snap } from '../utils/snap';

interface RotuleProps {
  x: number;
  y: number;
  rotation: number;
  selected: boolean;
  onSelect: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDblClick: () => void;
}

export function Rotule({ x, y, rotation, selected, onSelect, onDragMove, onDragEnd, onDblClick }: RotuleProps) {
  const r = 14;
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
      <Line points={[0, -r, 0, r]} stroke={strokeColor} strokeWidth={strokeWidth} />
      <Line points={[-r, 0, r, 0]} stroke={strokeColor} strokeWidth={strokeWidth} />
      <Circle radius={2.5} fill={strokeColor} />
    </Group>
  );
}
