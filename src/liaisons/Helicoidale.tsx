import { Circle, Group, Line, Rect } from 'react-konva';
import { snap } from '../utils/snap';

interface HelicoidaleProps {
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

export function Helicoidale({ x, y, rotation, view = 1, selected, colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: HelicoidaleProps) {
  const r = 12;
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
          {/* Plan view: rectangle (A) + diagonal top-left to bottom-right (A) */}
          <Rect x={-w / 2} y={-h / 2} width={w} height={h} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
          <Line points={[-w / 2, -h / 2, w / 2, h / 2]} stroke={colorA} strokeWidth={strokeWidth} />
        </>
      ) : (
        <>
          {/* Section view: outer circle (A) + inner semicircle (B) */}
          <Circle radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
          <Line
            points={Array.from({ length: 17 }, (_, i) => {
              const a = -Math.PI / 2 + (Math.PI * i) / 16;
              return [8 * Math.cos(a), 8 * Math.sin(a)];
            }).flat()}
            stroke={colorB}
            strokeWidth={1.5}
          />
        </>
      )}
    </Group>
  );
}
