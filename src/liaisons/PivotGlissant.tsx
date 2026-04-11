import { Circle, Ellipse, Line, Path, Rect } from 'react-konva';
import { LiaisonNode, type LiaisonComponentProps } from './LiaisonNode';

export function PivotGlissant(props: LiaisonComponentProps) {
  const { view = 1, colorA = '#1a1a1a', colorB = '#1a1a1a' } = props;
  const r = 12;
  const h = 22;
  const strokeWidth = 1.5;

  return (
    <LiaisonNode type="pivot_glissant" {...props}>
      {view === 1 && (
        <>
          {/* Vue 1: rectangle (B) + axe horizontal (A), comme pivot mais sans tourillons */}
          <Rect x={-32} y={-h / 2} width={64} height={h} stroke={colorB} strokeWidth={strokeWidth} fill="white" />
          <Line points={[-32, 0, 32, 0]} stroke={colorA} strokeWidth={strokeWidth} />
        </>
      )}
      {view === 2 && (
        <>
          {/* Vue 2: cercle (A) + point central (B) */}
          <Circle radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
          <Circle radius={2.5} fill={colorB} />
        </>
      )}
      {view === 3 && (
        <>
          {/* Vue 3: cylindre vertical en perspective cavalière, sans tourillons ni axes */}
          <Rect x={-12} y={-22} width={24} height={44} fill="white" />
          <Line points={[-12, -22, -12, 22]} stroke={colorB} strokeWidth={strokeWidth} />
          <Line points={[12, -22, 12, 22]} stroke={colorB} strokeWidth={strokeWidth} />
          <Ellipse x={0} y={-22} radiusX={12} radiusY={7} stroke={colorB} strokeWidth={strokeWidth} fill="white" />
          <Path data="M -12 22 A 12 7 0 0 0 12 22 Z" fill="white" />
          <Path
            data="M -12 22 A 12 7 0 0 0 12 22"
            stroke={colorB}
            strokeWidth={strokeWidth}
            fill={undefined as unknown as string}
          />
        </>
      )}
    </LiaisonNode>
  );
}
