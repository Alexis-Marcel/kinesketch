import { Circle, Ellipse, Group, Line, Path, Rect } from 'react-konva';
import { snapPx } from '../utils/snap';
import { HitRect } from './HitRect';

interface PivotProps {
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

export function Pivot({ x, y, rotation, scale = 1, view = 1,  colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: PivotProps) {
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
      <HitRect type="pivot" view={view} />
      {view === 1 && (
        <>
          {/* Vue 1: rectangle horizontal (palier=B) + barre horizontale (A) */}
          <Rect x={-32} y={-11} width={64} height={22} stroke={colorB} strokeWidth={strokeWidth} fill="white" />
          {/* Axe horizontal — s'arrête au tourillon */}
          <Line points={[-36, 0, 36, 0]} stroke={colorA} strokeWidth={strokeWidth} />
          {/* Tourillons — hauteur = largeur du rectangle (22), proches du rectangle */}
          <Line points={[-36, -11, -36, 11]} stroke={colorA} strokeWidth={strokeWidth} />
          <Line points={[36, -11, 36, 11]} stroke={colorA} strokeWidth={strokeWidth} />
        </>
      )}
      {view === 2 && (
        <>
          {/* Vue 2: cercle (vu de bout) */}
          <Circle radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
        </>
      )}
      {view === 3 && (
        <>
          {/* Vue 3: cylindre vertical en perspective cavalière (opaque) */}
          {/* Barre au-dessus (s'arrête au tourillon) */}
          <Line points={[0, -35, 0, -29]} stroke={colorA} strokeWidth={strokeWidth} />
          {/* Tourillon haut — légère diagonale */}
          <Line points={[-10, -37, 10, -33]} stroke={colorA} strokeWidth={strokeWidth} />

          {/* Corps du cylindre — fond blanc opaque qui masque l'arrière */}
          <Rect x={-12} y={-22} width={24} height={44} fill="white" />
          {/* Côtés verticaux */}
          <Line points={[-12, -22, -12, 22]} stroke={colorB} strokeWidth={strokeWidth} />
          <Line points={[12, -22, 12, 22]} stroke={colorB} strokeWidth={strokeWidth} />
          {/* Ellipse du haut — visible entièrement */}
          <Ellipse x={0} y={-22} radiusX={12} radiusY={7} stroke={colorB} strokeWidth={strokeWidth} fill="white" />
          {/* Barre qui pénètre dans l'ellipse du haut (rendue après l'ellipse pour passer par-dessus) */}
          <Line points={[0, -29, 0, -22]} stroke={colorA} strokeWidth={strokeWidth} />
          {/* Demi-ellipse du bas — fill blanc fermé */}
          <Path
            data="M -12 22 A 12 7 0 0 0 12 22 Z"
            fill="white"
          />
          {/* Demi-ellipse du bas — stroke seulement de l'arc (sans la ligne de fermeture) */}
          <Path
            data="M -12 22 A 12 7 0 0 0 12 22"
            stroke={colorB}
            strokeWidth={strokeWidth}
            fill={undefined as unknown as string}
          />

          {/* Barre sous le cylindre (s'arrête au tourillon) */}
          <Line points={[0, 29, 0, 35]} stroke={colorA} strokeWidth={strokeWidth} />
          {/* Tourillon bas — légère diagonale */}
          <Line points={[-10, 33, 10, 37]} stroke={colorA} strokeWidth={strokeWidth} />
        </>
      )}
    </Group>
  );
}
