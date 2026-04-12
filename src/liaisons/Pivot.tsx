import { Circle, Ellipse, Line, Path, Rect } from 'react-konva';
import { LiaisonNode, type LiaisonComponentProps } from './LiaisonNode';

export function Pivot(props: LiaisonComponentProps) {
  const { view = 1, colorA = '#1a1a1a', colorB = '#1a1a1a' } = props;
  const r = 12;
  const strokeWidth = 1.5;

  return (
    <LiaisonNode type="pivot" {...props}>
      {view === 1 && (
        <>
          {/* Vue 1: rectangle horizontal (palier=B) + axe horizontal (A)
              dépassant légèrement les tourillons aux deux extrémités */}
          <Rect x={-32} y={-11} width={64} height={22} stroke={colorB} strokeWidth={strokeWidth} fill="white" />
          <Line points={[-42, 0, 42, 0]} stroke={colorA} strokeWidth={strokeWidth} />
          {/* Tourillons — verticales aux extrémités du palier */}
          <Line points={[-36, -11, -36, 11]} stroke={colorA} strokeWidth={strokeWidth} />
          <Line points={[36, -11, 36, 11]} stroke={colorA} strokeWidth={strokeWidth} />
        </>
      )}
      {view === 2 && (
        <Circle radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
      )}
      {view === 3 && (
        <>
          {/* Vue 3: cylindre vertical en perspective cavalière (opaque)
              L'axe (A) traverse le cylindre et dépasse au-delà des tourillons
              de quelques px aux deux extrémités. */}
          <Line points={[0, -42, 0, -29]} stroke={colorA} strokeWidth={strokeWidth} />
          <Line points={[-10, -37, 10, -33]} stroke={colorA} strokeWidth={strokeWidth} />

          <Rect x={-12} y={-22} width={24} height={44} fill="white" />
          <Line points={[-12, -22, -12, 22]} stroke={colorB} strokeWidth={strokeWidth} />
          <Line points={[12, -22, 12, 22]} stroke={colorB} strokeWidth={strokeWidth} />
          <Ellipse x={0} y={-22} radiusX={12} radiusY={7} stroke={colorB} strokeWidth={strokeWidth} fill="white" />
          <Line points={[0, -29, 0, -22]} stroke={colorA} strokeWidth={strokeWidth} />
          <Path data="M -12 22 A 12 7 0 0 0 12 22 Z" fill="white" />
          <Path
            data="M -12 22 A 12 7 0 0 0 12 22"
            stroke={colorB}
            strokeWidth={strokeWidth}
            fill={undefined as unknown as string}
          />

          <Line points={[0, 29, 0, 42]} stroke={colorA} strokeWidth={strokeWidth} />
          <Line points={[-10, 33, 10, 37]} stroke={colorA} strokeWidth={strokeWidth} />
        </>
      )}
    </LiaisonNode>
  );
}
