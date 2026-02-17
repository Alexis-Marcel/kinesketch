import { Group, Line } from 'react-konva';
import { snap } from '../utils/snap';

interface LineaireRectiligneProps {
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

export function LineaireRectiligne({ x, y, rotation, view = 1, selected, colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: LineaireRectiligneProps) {
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
      {view === 1 ? (
        <>
          {/* Plan view: open trapezoid (A) + horizontal line (B) */}
          <Line points={[-22, -11, 22, -11]} stroke={colorA} strokeWidth={strokeWidth} />
          <Line points={[-22, -11, -7, 11]} stroke={colorA} strokeWidth={strokeWidth} />
          <Line points={[22, -11, 7, 11]} stroke={colorA} strokeWidth={strokeWidth} />
          <Line points={[-22, 11, 22, 11]} stroke={colorB} strokeWidth={strokeWidth} />
        </>
      ) : (
        <>
          {/* Section view: horizontal line top (B) + downward triangle (A) + horizontal line bottom (B) */}
          <Line points={[-19, -11, 19, -11]} stroke={colorB} strokeWidth={strokeWidth} />
          <Line points={[-19, -11, 0, 11]} stroke={colorA} strokeWidth={strokeWidth} />
          <Line points={[19, -11, 0, 11]} stroke={colorA} strokeWidth={strokeWidth} />
          <Line points={[-19, 11, 19, 11]} stroke={colorB} strokeWidth={strokeWidth} />
        </>
      )}
    </Group>
  );
}
