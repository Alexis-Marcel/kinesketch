import { Circle, Group, Line } from 'react-konva';
import { snapPx } from '../utils/snap';
import { HitRect } from './HitRect';

interface PonctuelleProps {
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

export function Ponctuelle({ x, y, rotation, scale = 1, view = 1, colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: PonctuelleProps) {
  const r = 12;
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
      <HitRect type="ponctuelle" view={view} />
      {view !== 3 && (
        <>
          {/* Vue 1: cercle (A) + ligne horizontale (B) */}
          <Circle radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
          <Line points={[-32, r, 32, r]} stroke={colorB} strokeWidth={strokeWidth} />
        </>
      )}
      {view === 3 && (
        <>
          {/* Vue 3: losange en perspective cavalière (B) + cercle au-dessus (A) */}
          {/* Losange du plan B */}
          <Line
            points={[-28, 5, 0, 19, 28, 5, 0, -9]}
            closed
            stroke={colorB}
            strokeWidth={strokeWidth}
            fill="white"
            lineJoin="bevel"
          />
          {/* Cercle (A) au-dessus du plan, son bas passe par le centre du losange */}
          <Circle x={0} y={-7} radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
        </>
      )}
    </Group>
  );
}
