import { Line, Rect } from 'react-konva';
import { LiaisonNode, type LiaisonComponentProps } from './LiaisonNode';

export function Glissiere(props: LiaisonComponentProps) {
  const { view = 1, colorA = '#1a1a1a', colorB = '#1a1a1a' } = props;
  const h = 22;
  const strokeWidth = 1.5;

  return (
    <LiaisonNode type="glissiere" {...props}>
      {view === 1 && (
        <>
          {/* Vue 1: rectangle (A) + axe (B) visible uniquement aux extrémités —
              le rectangle masque la partie centrale */}
          <Line points={[-42, 0, -32, 0]} stroke={colorB} strokeWidth={strokeWidth} />
          <Line points={[32, 0, 42, 0]} stroke={colorB} strokeWidth={strokeWidth} />
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
        // Vue 3: pavé droit en perspective propre. La face avant (XY) est un
        // parallélogramme dont le coin bas-droite (fbr) est le point le plus
        // bas de la figure. Une croix sur la face du dessus marque la
        // section. dx = halfW : ça fait coïncider fbr, yj et btl sur la
        // verticale x=0, donc l'axe (B) vertical s'aligne avec une diagonale
        // de la croix (yj→btl) et continue à travers l'arête droite de la
        // face avant (yj→fbr) jusqu'à fbr.
        const halfW = 10;
        const halfH = 24;
        const dx = 10;   // = halfW pour aligner l'axe avec la croix
        const dy = 5;
        const tilt = 4;
        const axisHalf = 40;

        const project = (sx: number, sy: number, sz: number) => ({
          x: sx * halfW + sz * dx,
          y: sy * halfH + sx * tilt - sz * dy,
        });

        const fbl = project(-1, +1, -1);
        const fbr = project(+1, +1, -1); // bottom-right of front face = lowest point of figure
        const bbr = project(+1, +1, +1);
        const btr = project(+1, -1, +1);
        const btl = project(-1, -1, +1);
        const ftl = project(-1, -1, -1);
        const yj = project(+1, -1, -1); // front-top-right = visible Y junction

        return (
          <>
            {/* Silhouette hexagonale (fill blanc) */}
            <Line
              points={[fbr.x, fbr.y, fbl.x, fbl.y, ftl.x, ftl.y, btl.x, btl.y, btr.x, btr.y, bbr.x, bbr.y]}
              closed
              fill="white"
              stroke={colorA}
              strokeWidth={strokeWidth}
              lineJoin="miter"
            />
            {/* 2 arêtes intérieures depuis le Y junction (la 3e, yj→fbr,
                est confondue avec l'axe vertical et n'est pas dessinée séparément) */}
            <Line points={[yj.x, yj.y, ftl.x, ftl.y]} stroke={colorA} strokeWidth={strokeWidth} lineCap="round" />
            <Line points={[yj.x, yj.y, btr.x, btr.y]} stroke={colorA} strokeWidth={strokeWidth} lineCap="round" />
            {/* Diagonale slanted de la croix (l'autre diagonale, yj→btl, est
                confondue avec l'axe — voir ci-dessous). Tracée après la
                silhouette pour rester visible sur le fill. */}
            <Line points={[ftl.x, ftl.y, btr.x, btr.y]} stroke={colorB} strokeWidth={strokeWidth} lineCap="round" />
            {/* Axe (B) — verticale unique à x=0 qui couvre :
                  - y < btl.y : stub au-dessus
                  - btl.y → yj.y : diagonale verticale de la croix
                  - yj.y → fbr.y : arête droite de la face avant
                  - y > fbr.y : stub en dessous */}
            <Line points={[0, -axisHalf, 0, axisHalf]} stroke={colorB} strokeWidth={strokeWidth} lineCap="round" />
          </>
        );
      })()}
    </LiaisonNode>
  );
}
