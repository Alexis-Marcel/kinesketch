import { Circle, Group, Line } from 'react-konva';
import { snap } from '../utils/snap';

interface HelicoidaleProps {
  x: number;
  y: number;
  rotation: number;
  selected: boolean;
  onSelect: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDblClick: () => void;
}

export function Helicoidale({ x, y, rotation, selected, onSelect, onDragMove, onDragEnd, onDblClick }: HelicoidaleProps) {
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
      {/* Circle */}
      <Circle radius={r} stroke={strokeColor} strokeWidth={strokeWidth} fill="white" />
      {/* Center dot */}
      <Circle radius={2.5} fill={strokeColor} />
      {/* Diagonal line through circle (helix indicator) */}
      <Line
        points={[-r * 0.7, -r * 0.7, r * 0.7, r * 0.7]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {/* Axis line */}
      <Line
        points={[0, -r - 8, 0, r + 8]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
    </Group>
  );
}
