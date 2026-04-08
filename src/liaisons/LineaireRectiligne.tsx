import { Group, Line } from 'react-konva';
import { snapPx } from '../utils/snap';
import { HitRect } from './HitRect';

interface LineaireRectiligneProps {
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

export function LineaireRectiligne({ x, y, rotation, scale = 1, view = 1,  colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: LineaireRectiligneProps) {
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
      <HitRect type="lineaire_rectiligne" view={view} />
      {view === 1 && (
        <>
          {/* Vue 1: trapèze ouvert (A) + ligne horizontale (B) */}
          <Line points={[-19, 11, -26, -8, 26, -8, 19, 11]} stroke={colorA} strokeWidth={strokeWidth} lineJoin="miter" />
          <Line points={[-32, 11, 32, 11]} stroke={colorB} strokeWidth={strokeWidth} />
        </>
      )}
      {view === 2 && (
        <>
          {/* Vue 2: triangle fermé (A) + ligne horizontale (B) */}
          <Line points={[-19, -11, 0, 11, 19, -11]} stroke={colorA} strokeWidth={strokeWidth} lineJoin="miter" closed />
          <Line points={[-19, 12, 19, 12]} stroke={colorB} strokeWidth={strokeWidth} />
        </>
      )}
{view === 3 && (() => {
  // Centré verticalement : on décale tout vers le bas de h/2
  const yShift = 5;
  const pL = { x: -28, y:   0 + yShift };
  const pF = { x:   0, y:  14 + yShift };
  const pR = { x:  28, y:   0 + yShift };
  const pB = { x:   0, y: -14 + yShift };

  const mStart = { x: (pL.x + pF.x) / 2, y: (pL.y + pF.y) / 2 };
  const mEnd   = { x: (pB.x + pR.x) / 2, y: (pB.y + pR.y) / 2 };

  const w = 6, h = 12;
  const d1x = pF.x - pL.x, d1y = pF.y - pL.y;
  const d1len = Math.sqrt(d1x*d1x + d1y*d1y);
  const ex = d1x/d1len * w, ey = d1y/d1len * w;

  const tA = { x: mStart.x - ex, y: mStart.y - ey - h };
  const tB = { x: mEnd.x   - ex, y: mEnd.y   - ey - h };
  const tC = { x: mEnd.x   + ex, y: mEnd.y   + ey - h };
  const tD = { x: mStart.x + ex, y: mStart.y + ey - h };

  return (
    <>
      {/* 1. Plan B */}
      <Line points={[pL.x,pL.y, pF.x,pF.y, pR.x,pR.y, pB.x,pB.y]}
        closed stroke={colorB} strokeWidth={strokeWidth} lineJoin="bevel" fill="white"/>

      {/* 2. Face droite — fill blanc sans contour pour masquer */}
      <Line points={[tD.x,tD.y, mStart.x,mStart.y, mEnd.x,mEnd.y, tC.x,tC.y]}
        closed fill="white" strokeWidth={0}/>

      {/* 3. Face avant — fill blanc sans contour pour masquer */}
      <Line points={[tA.x,tA.y, mStart.x,mStart.y, tD.x,tD.y]}
        closed fill="white" strokeWidth={0}/>

      {/* 4. Face dessus fill blanc + contour */}
      <Line points={[tA.x,tA.y, tB.x,tB.y, tC.x,tC.y, tD.x,tD.y]}
        closed stroke={colorA} strokeWidth={strokeWidth} lineJoin="bevel" fill="white"/>

      {/* 5. tC→mEnd→mStart→tA en un seul trait */}
      <Line points={[tC.x,tC.y, mEnd.x,mEnd.y, mStart.x,mStart.y, tA.x,tA.y]}
        stroke={colorA} strokeWidth={strokeWidth} lineJoin="bevel" lineCap="round"/>

      {/* 6. tD→mStart */}
      <Line points={[tD.x,tD.y, mStart.x,mStart.y]}
        stroke={colorA} strokeWidth={strokeWidth} lineCap="round"/>
    </>
  );
})()}

    </Group>
  );
}
