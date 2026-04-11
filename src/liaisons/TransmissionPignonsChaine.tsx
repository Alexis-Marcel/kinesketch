import { Arrow, Circle, Line } from 'react-konva';
import { LiaisonNode, type LiaisonComponentProps } from './LiaisonNode';

const LEFT_HALF_W = 36;
const RIGHT_HALF_W = 60;
const GAP = 60;
const LEFT_CX = -(LEFT_HALF_W + GAP / 2 + RIGHT_HALF_W) + LEFT_HALF_W;
const RIGHT_CX = LEFT_CX + LEFT_HALF_W + GAP + RIGHT_HALF_W;

const CHAIN_COLOR = '#22c55e';
const CHAIN_DASH: [number, number] = [6, 4];

export function TransmissionPignonsChaine(props: LiaisonComponentProps) {
  const { view = 1, colorA = '#1a1a1a', colorB = '#1a1a1a' } = props;
  const strokeWidth = 1.5;

  if (view === 2) {
    const r1 = LEFT_HALF_W;
    const r2 = RIGHT_HALF_W;
    const G = GAP;
    const cxSmall = (r1 - r2 - (r1 + G + r2)) / 2;
    const cxBig = (r1 - r2 + (r1 + G + r2)) / 2;
    return (
      <LiaisonNode type="transmission_pignons_chaine" {...props}>
        <Line points={[cxSmall, -r1, cxBig, -r2]} stroke={CHAIN_COLOR} strokeWidth={strokeWidth} dash={CHAIN_DASH} />
        <Line points={[cxSmall, r1, cxBig, r2]} stroke={CHAIN_COLOR} strokeWidth={strokeWidth} dash={CHAIN_DASH} />
        <Circle x={cxSmall} y={0} radius={r1} fill="white" stroke={colorA} strokeWidth={strokeWidth} />
        <Circle x={cxBig} y={0} radius={r2} fill="white" stroke={colorB} strokeWidth={strokeWidth} />
      </LiaisonNode>
    );
  }

  const leftL = LEFT_CX - LEFT_HALF_W;
  const leftR = LEFT_CX + LEFT_HALF_W;
  const rightL = RIGHT_CX - RIGHT_HALF_W;
  const rightR = RIGHT_CX + RIGHT_HALF_W;

  return (
    <LiaisonNode type="transmission_pignons_chaine" {...props}>
      <Line
        points={[leftR, 0, rightL, 0]}
        stroke={CHAIN_COLOR}
        strokeWidth={strokeWidth}
        dash={CHAIN_DASH}
      />
      <Arrow
        points={[leftL, 0, leftR, 0]}
        stroke={colorA}
        fill={colorA}
        strokeWidth={strokeWidth}
        pointerLength={6}
        pointerWidth={6}
        pointerAtBeginning
        pointerAtEnding
      />
      <Arrow
        points={[rightL, 0, rightR, 0]}
        stroke={colorB}
        fill={colorB}
        strokeWidth={strokeWidth}
        pointerLength={6}
        pointerWidth={6}
        pointerAtBeginning
        pointerAtEnding
      />
    </LiaisonNode>
  );
}
