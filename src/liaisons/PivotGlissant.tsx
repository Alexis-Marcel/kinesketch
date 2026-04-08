import { Circle, Ellipse, Group, Line, Path, Rect } from 'react-konva';
import { snapPx } from '../utils/snap';
import { HitRect } from './HitRect';

interface PivotGlissantProps {
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

export function PivotGlissant({ x, y, rotation, scale = 1, view = 1,  colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: PivotGlissantProps) {
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
      <HitRect type="pivot_glissant" view={view} />
      {view === 1 && (
        <>
          {/* Vue 1: rectangle (B) + axe horizontal (A), comme pivot mais sans tourillons */}
          <Rect x={-32} y={-h / 2} width={64} height={h} stroke={colorB} strokeWidth={strokeWidth} fill="white" />
          <Line points={[-32, 0, 32, 0]} stroke={colorA} strokeWidth={strokeWidth} />
        </>
      )}
      {view === 2 && (
        <>
          {/* Vue 2: cercle (A) + point central (B) */}
          <Circle radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
          <Circle radius={2.5} fill={colorB} />
        </>
      )}
      {view === 3 && (
        <>
          {/* Vue 3: cylindre vertical en perspective cavalière, sans tourillons ni axes */}
          {/* Corps du cylindre */}
          <Rect x={-12} y={-22} width={24} height={44} fill="white" />
          <Line points={[-12, -22, -12, 22]} stroke={colorB} strokeWidth={strokeWidth} />
          <Line points={[12, -22, 12, 22]} stroke={colorB} strokeWidth={strokeWidth} />
          {/* Ellipse du haut */}
          <Ellipse x={0} y={-22} radiusX={12} radiusY={7} stroke={colorB} strokeWidth={strokeWidth} fill="white" />
          {/* Demi-ellipse du bas — fill */}
          <Path data="M -12 22 A 12 7 0 0 0 12 22 Z" fill="white" />
          {/* Demi-ellipse du bas — stroke */}
          <Path
            data="M -12 22 A 12 7 0 0 0 12 22"
            stroke={colorB}
            strokeWidth={strokeWidth}
            fill={undefined as unknown as string}
          />
        </>
      )}
    </Group>
  );
}
