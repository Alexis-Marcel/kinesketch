import { Circle, Group, Line } from 'react-konva';
import { snap } from '../utils/snap';

interface PonctuelleProps {
  x: number;
  y: number;
  rotation: number;
  selected: boolean;
  onSelect: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDblClick: () => void;
}

export function Ponctuelle({ x, y, rotation, selected, onSelect, onDragMove, onDragEnd, onDblClick }: PonctuelleProps) {
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
      {/* Small circle (point of contact) */}
      <Circle y={-4} radius={4} stroke={strokeColor} strokeWidth={strokeWidth} fill="white" />
      {/* Contact surface line */}
      <Line
        points={[-18, 0, 18, 0]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {/* Hatching below surface */}
      {Array.from({ length: 7 }, (_, i) => {
        const xPos = -18 + i * 6;
        return (
          <Line
            key={i}
            points={[xPos, 0, xPos - 4, 8]}
            stroke={strokeColor}
            strokeWidth={1.5}
          />
        );
      })}
    </Group>
  );
}
