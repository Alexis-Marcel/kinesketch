import { Group, Line } from 'react-konva';
import { snap } from '../utils/snap';

interface AppuiPlanProps {
  x: number;
  y: number;
  rotation: number;
  selected: boolean;
  onSelect: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDblClick: () => void;
}

export function AppuiPlan({ x, y, rotation, selected, onSelect, onDragMove, onDragEnd, onDblClick }: AppuiPlanProps) {
  const w = 36;
  const strokeColor = selected ? '#2563eb' : '#1a1a1a';
  const strokeWidth = selected ? 2.5 : 2;

  // Hatching lines below the contact surface
  const hatches: Array<[number, number, number, number]> = [];
  const count = 7;
  for (let i = 0; i <= count; i++) {
    const xPos = -w / 2 + i * (w / count);
    hatches.push([xPos, 0, xPos - 5, 8]);
  }

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
      {/* Contact surface line */}
      <Line
        points={[-w / 2, 0, w / 2, 0]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      {/* Hatching below */}
      {hatches.map((pts, i) => (
        <Line
          key={i}
          points={pts}
          stroke={strokeColor}
          strokeWidth={1.5}
        />
      ))}
      {/* Vertical connector line above */}
      <Line
        points={[0, -16, 0, 0]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
    </Group>
  );
}
