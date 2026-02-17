import { Group, Line } from 'react-konva';
import { snap } from '../utils/snap';

interface AppuiPlanProps {
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

export function AppuiPlan({ x, y, rotation, selected, colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: AppuiPlanProps) {
  const w = 36;
  const gap = 6;
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
      {/* Two parallel horizontal lines */}
      <Line points={[-w / 2, -gap / 2, w / 2, -gap / 2]} stroke={colorA} strokeWidth={strokeWidth} />
      <Line points={[-w / 2, gap / 2, w / 2, gap / 2]} stroke={colorB} strokeWidth={strokeWidth} />
    </Group>
  );
}
