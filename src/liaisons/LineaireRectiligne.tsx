import { Group, Line } from 'react-konva';
import { snap } from '../utils/snap';

interface LineaireRectiligneProps {
  x: number;
  y: number;
  rotation: number;
  selected: boolean;
  onSelect: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDblClick: () => void;
}

export function LineaireRectiligne({ x, y, rotation, selected, onSelect, onDragMove, onDragEnd, onDblClick }: LineaireRectiligneProps) {
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
      {/* V-groove: left angled line */}
      <Line
        points={[-14, -12, 0, 6]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {/* V-groove: right angled line */}
      <Line
        points={[14, -12, 0, 6]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {/* Horizontal contact line below */}
      <Line
        points={[-18, 6, 18, 6]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {/* Hatching under contact */}
      {Array.from({ length: 7 }, (_, i) => {
        const xPos = -18 + i * 6;
        return (
          <Line
            key={i}
            points={[xPos, 6, xPos - 4, 14]}
            stroke={strokeColor}
            strokeWidth={1.5}
          />
        );
      })}
    </Group>
  );
}
