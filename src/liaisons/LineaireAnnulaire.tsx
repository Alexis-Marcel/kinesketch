import { Circle, Group, Line, Path, Rect } from 'react-konva';
import { snapPx } from '../utils/snap';
import { HitRect } from './HitRect';

interface LineaireAnnulaireProps {
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

export function LineaireAnnulaire({ x, y, rotation, scale = 1, view = 1,  colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: LineaireAnnulaireProps) {
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
      <HitRect type="lineaire_annulaire" view={view} />
      {view === 1 && (
        <>
          {/* Vue 1: rectangle (B) + cercle centré sur arête haute (A) */}
          <Rect x={-32} y={-2} width={64} height={16} stroke={colorB} strokeWidth={strokeWidth} fill="white" />
          <Circle x={0} y={-2} radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
        </>
      )}
      {view === 2 && (
        <>
          {/* Vue 2: cercle (A) + demi-cercle bas (B) + ligne du bas (B) */}
          <Circle radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
          <Line
            points={Array.from({ length: 17 }, (_, i) => {
              const a = (Math.PI * i) / 16;
              return [15 * Math.cos(a), 15 * Math.sin(a)];
            }).flat()}
            stroke={colorB}
            strokeWidth={strokeWidth}
          />
          <Line points={[-19, 15, 19, 15]} stroke={colorB} strokeWidth={strokeWidth} />
        </>
      )}
      {view === 3 && (() => {
        {/* Vue 3: gouttière (demi-cylindre) en perspective cavalière, vue légèrement de dessus
            Dessinée comme un seul path fermé pour avoir un vrai fill blanc. */}
        const halfLen = 18;
        const erx = 10;       // demi-largeur de l'ellipse
        const ery = 12;       // demi-hauteur de l'ellipse
        const tilt = 3;       // inclinaison vue de dessus
        const depthRise = 15; // décalage vertical du back par rapport au front

        // Front center (gauche, plus bas) — décalé pour centrer verticalement
        const fx = -halfLen, fy = depthRise / 2;
        // Back center (droite, plus haut) — décalé pour centrer verticalement
        const bx = halfLen, by = -depthRise / 2;

        // Silhouette : front-left → front arc → front-right → back-right → back arc → back-left → close
        const silhouette =
          `M ${fx - erx} ${fy - tilt}` +
          ` A ${erx} ${ery} 0 0 0 ${fx + erx} ${fy + tilt}` +
          ` L ${bx + erx} ${by + tilt}` +
          ` A ${erx} ${ery} 0 0 1 ${bx - erx} ${by - tilt}` +
          ` Z`;

        // Bande du dessous-droit (visible parce qu'on voit la gouttière de côté)
        // Bordée par le rebord droit en haut, un arc en bas qui suit la courbure
        // Front-bottom-right: point sur le front arc, à droite du milieu
        const fbrX = fx + erx * 0.6, fbrY = fy + ery * 0.9;
        // Back-bottom-right: point sur le back arc, à droite du milieu
        const bbrX = bx + erx * 0.6, bbrY = by + ery * 0.9;

        // Path : front-right rim → back-right rim → back arc partiel jusqu'au bottom-right → ligne du dessous → front arc partiel jusqu'au front-right rim
        const undersidePath =
          `M ${fx + erx} ${fy + tilt}` +
          ` L ${bx + erx} ${by + tilt}` +
          ` A ${erx} ${ery} 0 0 1 ${bbrX} ${bbrY}` +
          ` L ${fbrX} ${fbrY}` +
          ` A ${erx} ${ery} 0 0 0 ${fx + erx} ${fy + tilt}` +
          ` Z`;

        // Sphère (A) à l'intérieur de la gouttière, vers le centre
        const sphereCx = (fx + bx) / 2 - 5;
        const sphereCy = (fy + by) / 2 + 2;
        const sphereR = 10;


        return (
          <>
            {/* 1. Silhouette principale de la gouttière */}
            <Path
              data={silhouette}
              stroke={colorB}
              strokeWidth={strokeWidth}
              fill="white"
              lineJoin="bevel"
            />
            {/* 2. Sphère (A) à l'intérieur de la gouttière */}
            <Circle x={sphereCx} y={sphereCy} radius={sphereR} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
            {/* 3. Re-dessine le rebord droit + back arc en stroke seul devant la sphère */}
            <Path
              data={
                `M ${fx + erx} ${fy + tilt}` +
                ` L ${bx + erx} ${by + tilt}` +
                ` A ${erx} ${ery} 0 0 1 ${bx - erx} ${by - tilt}`
              }
              stroke={colorB}
              strokeWidth={strokeWidth}
              fill={undefined as unknown as string}
            />
            {/* 4. Bande du dessous-droit (avec fill) — passe DEVANT la sphère ET le back arc */}
            <Path
              data={undersidePath}
              stroke={colorB}
              strokeWidth={strokeWidth}
              fill="white"
              lineJoin="bevel"
            />
          </>
        );
      })()}
    </Group>
  );
}
