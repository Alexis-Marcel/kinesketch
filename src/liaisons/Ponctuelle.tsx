import { Circle, Line } from 'react-konva';
import { LiaisonNode, type LiaisonComponentProps } from './LiaisonNode';

export function Ponctuelle(props: LiaisonComponentProps) {
  const { view = 1, colorA = '#1a1a1a', colorB = '#1a1a1a' } = props;
  const r = 12;
  const strokeWidth = 1.5;

  return (
    <LiaisonNode type="ponctuelle" {...props}>
      {view !== 3 && (
        <>
          {/* Vue 1: cercle (A) + ligne horizontale (B) */}
          <Circle radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
          <Line points={[-32, r, 32, r]} stroke={colorB} strokeWidth={strokeWidth} />
        </>
      )}
      {view === 3 && (
        <>
          {/* Vue 3: losange en perspective cavalière (B) + cercle au-dessus (A) */}
          <Line
            points={[-28, 5, 0, 19, 28, 5, 0, -9]}
            closed
            stroke={colorB}
            strokeWidth={strokeWidth}
            fill="white"
            lineJoin="bevel"
          />
          <Circle x={0} y={-7} radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
        </>
      )}
    </LiaisonNode>
  );
}
