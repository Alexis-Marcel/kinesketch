import { Circle, Line, Path, Rect } from 'react-konva';
import { LiaisonNode, type LiaisonComponentProps } from './LiaisonNode';

export function LineaireAnnulaire(props: LiaisonComponentProps) {
  const { view = 1, colorA = '#1a1a1a', colorB = '#1a1a1a' } = props;
  const r = 12;
  const strokeWidth = 1.5;

  return (
    <LiaisonNode type="lineaire_annulaire" {...props}>
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
        // Vue 3: gouttière (demi-cylindre) en perspective cavalière, vue légèrement de dessus
        const halfLen = 18;
        const erx = 10;
        const ery = 12;
        const tilt = 3;
        const depthRise = 15;

        const fx = -halfLen, fy = depthRise / 2;
        const bx = halfLen, by = -depthRise / 2;

        const silhouette =
          `M ${fx - erx} ${fy - tilt}` +
          ` A ${erx} ${ery} 0 0 0 ${fx + erx} ${fy + tilt}` +
          ` L ${bx + erx} ${by + tilt}` +
          ` A ${erx} ${ery} 0 0 1 ${bx - erx} ${by - tilt}` +
          ` Z`;

        const fbrX = fx + erx * 0.6, fbrY = fy + ery * 0.9;
        const bbrX = bx + erx * 0.6, bbrY = by + ery * 0.9;

        const undersidePath =
          `M ${fx + erx} ${fy + tilt}` +
          ` L ${bx + erx} ${by + tilt}` +
          ` A ${erx} ${ery} 0 0 1 ${bbrX} ${bbrY}` +
          ` L ${fbrX} ${fbrY}` +
          ` A ${erx} ${ery} 0 0 0 ${fx + erx} ${fy + tilt}` +
          ` Z`;

        const sphereCx = (fx + bx) / 2 - 5;
        const sphereCy = (fy + by) / 2 + 2;
        const sphereR = 10;

        return (
          <>
            <Path
              data={silhouette}
              stroke={colorB}
              strokeWidth={strokeWidth}
              fill="white"
              lineJoin="bevel"
            />
            <Circle x={sphereCx} y={sphereCy} radius={sphereR} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
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
    </LiaisonNode>
  );
}
