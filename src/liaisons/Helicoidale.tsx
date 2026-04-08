import { Circle, Ellipse, Group, Line, Path, Rect } from 'react-konva';
import { snapPx } from '../utils/snap';
import { HitRect } from './HitRect';

interface HelicoidaleProps {
  x: number;
  y: number;
  rotation: number;
  scale?: number;
  view?: number;
  selected: boolean;
  colorA?: string;
  colorB?: string;
  onSelect: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDblClick: () => void;
}

export function Helicoidale({ x, y, rotation, scale = 1, view = 1,  colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: HelicoidaleProps) {
  const r = 12;
  const h = 22;
  const strokeWidth = 1.5;

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation} scaleX={scale} scaleY={scale}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onDblClick}
      onDragMove={(e) => {
        const sx = snapPx(e.target.x());
        const sy = snapPx(e.target.y());
        e.target.x(sx);
        e.target.y(sy);
        onDragMove(sx, sy);
      }}
      onDragEnd={(e) => {
        const sx = snapPx(e.target.x());
        const sy = snapPx(e.target.y());
        e.target.x(sx);
        e.target.y(sy);
        onDragEnd(sx, sy);
      }}
    >
      <HitRect type="helicoidale" view={view} />
      {view === 1 && (
        <>
          {/* Vue 1: rectangle (A) + diagonale */}
          <Rect x={-32} y={-h / 2} width={64} height={h} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
          <Line points={[-32, -h / 2, 32, h / 2]} stroke={colorA} strokeWidth={strokeWidth} />
        </>
      )}
      {view === 2 && (
        <>
          {/* Vue 2: cercle extérieur (A) + demi-cercle intérieur (B) */}
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
      {view === 3 && (
        <>
          {/* Vue 3: cylindre vertical en perspective cavalière + hélice diagonale */}
          {/* Corps du cylindre */}
          <Rect x={-12} y={-22} width={24} height={44} fill="white" />
          <Line points={[-12, -22, -12, 22]} stroke={colorB} strokeWidth={strokeWidth} />
          <Line points={[12, -22, 12, 22]} stroke={colorB} strokeWidth={strokeWidth} />
          {/* Ellipse du haut */}
          <Ellipse x={0} y={-22} radiusX={12} radiusY={7} stroke={colorB} strokeWidth={strokeWidth} fill="white" />
          {/* Demi-ellipse du bas */}
          <Path data="M -12 22 A 12 7 0 0 0 12 22 Z" fill="white" />
          <Path
            data="M -12 22 A 12 7 0 0 0 12 22"
            stroke={colorB}
            strokeWidth={strokeWidth}
            fill={undefined as unknown as string}
          />
          {/* Hélice — plusieurs arcs (mêmes radii que l'ellipse du haut) le long du cylindre */}
          {[-15, -8, -1, 6, 13].map((yArc, i) => (
            <Path
              key={i}
              data={`M -12 ${yArc} A 12 7 0 0 0 12 ${yArc}`}
              stroke={colorA}
              strokeWidth={strokeWidth}
              fill={undefined as unknown as string}
            />
          ))}
        </>
      )}
    </Group>
  );
}
