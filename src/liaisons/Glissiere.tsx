import { Group, Line, Rect } from 'react-konva';
import { snapPx } from '../utils/snap';
import { HitRect } from './HitRect';

interface GlissiereProps {
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

export function Glissiere({ x, y, rotation, scale = 1, view = 1,  colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: GlissiereProps) {
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
      <HitRect type="glissiere" view={view} />
      {view === 1 && (
        <>
          {/* Vue 1: rectangle horizontal */}
          <Rect x={-32} y={-h / 2} width={64} height={h} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
        </>
      )}
      {view === 2 && (
        <>
          {/* Vue 2: section carrée (A) + croix (B) */}
          <Rect x={-h / 2} y={-h / 2} width={h} height={h} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
          <Line points={[-h / 2, -h / 2, h / 2, h / 2]} stroke={colorB} strokeWidth={strokeWidth} />
          <Line points={[h / 2, -h / 2, -h / 2, h / 2]} stroke={colorB} strokeWidth={strokeWidth} />
        </>
      )}
      {view === 3 && (() => {
        {/* Vue 3: pavé droit VERTICAL en perspective cavalière (long axis = Y vertical) */}
        {/* Caméra : on voit la face avant, le dessus et le coté droit */}
        {/* Coin caché : back-bottom-left (sx=-1, sy=+1, sz=+1) */}
        {/* Y junction (coin intérieur visible) : front-top-right (sx=+1, sy=-1, sz=-1) */}
        const halfW = 7;    // demi-largeur (X)
        const halfH = 22;   // demi-hauteur (Y, long axis)
        const dx = 6;       // composante X de la profondeur cavalière
        const dy = 3.5;     // composante Y de la profondeur cavalière (vers le haut)

        // Convention : sy=-1 = top (Konva y inversé), sz=+1 = arrière
        // L'arrière monte vers le haut-droite : screen_x += sz*dx, screen_y -= sz*dy
        const project = (sx: number, sy: number, sz: number) => ({
          x: sx * halfW + sz * dx,
          y: sy * halfH - sz * dy,
        });

        const fbl = project(-1, +1, -1); // front-bottom-left
        const fbr = project(+1, +1, -1); // front-bottom-right
        const bbr = project(+1, +1, +1); // back-bottom-right
        const btr = project(+1, -1, +1); // back-top-right
        const btl = project(-1, -1, +1); // back-top-left
        const ftl = project(-1, -1, -1); // front-top-left
        const yj  = project(+1, -1, -1); // front-top-right (Y junction)

        return (
          <>
            {/* Silhouette hexagonale */}
            <Line
              points={[fbl.x, fbl.y, fbr.x, fbr.y, bbr.x, bbr.y, btr.x, btr.y, btl.x, btl.y, ftl.x, ftl.y]}
              closed
              fill="white"
              stroke={colorA}
              strokeWidth={strokeWidth}
              lineJoin="miter"
            />
            {/* 3 arêtes intérieures convergent au Y junction (front-top-right) */}
            <Line points={[yj.x, yj.y, ftl.x, ftl.y]} stroke={colorA} strokeWidth={strokeWidth} lineCap="round" />
            <Line points={[yj.x, yj.y, fbr.x, fbr.y]} stroke={colorA} strokeWidth={strokeWidth} lineCap="round" />
            <Line points={[yj.x, yj.y, btr.x, btr.y]} stroke={colorA} strokeWidth={strokeWidth} lineCap="round" />
          </>
        );
      })()}
    </Group>
  );
}
