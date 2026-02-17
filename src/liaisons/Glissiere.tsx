import { Group, Line, Rect } from 'react-konva';
import { snap } from '../utils/snap';

interface GlissiereProps {
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

export function Glissiere({ x, y, rotation, view = 1, selected, colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: GlissiereProps) {
  const w = 44;
  const h = 22;
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
          {/* Plan view: simple rectangle, colored by top/bottom solid (A) */}
          <Rect x={-w / 2} y={-h / 2} width={w} height={h} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
        </>
      ) : (
        <>
          {/* Section view: square (A) + diagonal cross (B) */}
          <Rect x={-h / 2} y={-h / 2} width={h} height={h} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
          <Line points={[-h / 2, -h / 2, h / 2, h / 2]} stroke={colorB} strokeWidth={strokeWidth} />
          <Line points={[h / 2, -h / 2, -h / 2, h / 2]} stroke={colorB} strokeWidth={strokeWidth} />
        </>
      )}
    </Group>
  );
}
