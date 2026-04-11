import { Line, Rect } from 'react-konva';
import { LiaisonNode, type LiaisonComponentProps } from './LiaisonNode';

export function Glissiere(props: LiaisonComponentProps) {
  const { view = 1, colorA = '#1a1a1a', colorB = '#1a1a1a' } = props;
  const h = 22;
  const strokeWidth = 1.5;

  return (
    <LiaisonNode type="glissiere" {...props}>
      {view === 1 && (
        <Rect x={-32} y={-h / 2} width={64} height={h} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
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
        // Vue 3: pavé droit VERTICAL en perspective cavalière (long axis = Y vertical)
        const halfW = 7;
        const halfH = 22;
        const dx = 6;
        const dy = 3.5;

        const project = (sx: number, sy: number, sz: number) => ({
          x: sx * halfW + sz * dx,
          y: sy * halfH - sz * dy,
        });

        const fbl = project(-1, +1, -1);
        const fbr = project(+1, +1, -1);
        const bbr = project(+1, +1, +1);
        const btr = project(+1, -1, +1);
        const btl = project(-1, -1, +1);
        const ftl = project(-1, -1, -1);
        const yj = project(+1, -1, -1);

        return (
          <>
            <Line
              points={[fbl.x, fbl.y, fbr.x, fbr.y, bbr.x, bbr.y, btr.x, btr.y, btl.x, btl.y, ftl.x, ftl.y]}
              closed
              fill="white"
              stroke={colorA}
              strokeWidth={strokeWidth}
              lineJoin="miter"
            />
            <Line points={[yj.x, yj.y, ftl.x, ftl.y]} stroke={colorA} strokeWidth={strokeWidth} lineCap="round" />
            <Line points={[yj.x, yj.y, fbr.x, fbr.y]} stroke={colorA} strokeWidth={strokeWidth} lineCap="round" />
            <Line points={[yj.x, yj.y, btr.x, btr.y]} stroke={colorA} strokeWidth={strokeWidth} lineCap="round" />
          </>
        );
      })()}
    </LiaisonNode>
  );
}
