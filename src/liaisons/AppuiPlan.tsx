import { Group, Line } from 'react-konva';
import { snapPx } from '../utils/snap';
import { HitRect } from './HitRect';

interface AppuiPlanProps {
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

export function AppuiPlan({ x, y, rotation, scale = 1, view = 1, colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: AppuiPlanProps) {
  const w = 64;
  const gap = 6;
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
      <HitRect type="appui_plan" view={view} />
      {view !== 3 && (
        <>
          {/* Vue 1: deux lignes parallèles horizontales */}
          <Line points={[-w / 2, -gap / 2, w / 2, -gap / 2]} stroke={colorA} strokeWidth={strokeWidth} />
          <Line points={[-w / 2, gap / 2, w / 2, gap / 2]} stroke={colorB} strokeWidth={strokeWidth} />
        </>
      )}
      {view === 3 && (() => {
        {/* Vue 3: deux losanges en perspective cavalière, légèrement décalés */}
        const offset = 8; // décalage vertical entre les deux plans
        // Losange A (en haut)
        const aPts = [-28, -offset / 2 + 0, 0, -offset / 2 + 14, 28, -offset / 2 + 0, 0, -offset / 2 + -14];
        // Losange B (en bas)
        const bPts = [-28, offset / 2 + 0, 0, offset / 2 + 14, 28, offset / 2 + 0, 0, offset / 2 + -14];
        return (
          <>
            {/* B (bas) dessiné en premier — derrière */}
            <Line points={bPts} closed stroke={colorB} strokeWidth={strokeWidth} fill="white" lineJoin="bevel" />
            {/* A (haut) dessiné en dernier — devant */}
            <Line points={aPts} closed stroke={colorA} strokeWidth={strokeWidth} fill="white" lineJoin="bevel" />
          </>
        );
      })()}
    </Group>
  );
}
