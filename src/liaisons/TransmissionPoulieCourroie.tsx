import { Circle, Line } from 'react-konva';
import { LiaisonNode, type LiaisonComponentProps } from './LiaisonNode';

// View 1 layout — two pulleys side by side: a horizontal segment with a short
// vertical cap at each end, the caps extending only DOWNWARD from the bar.
const CAP_LEN = 18;
const HORIZONTAL_Y = -CAP_LEN / 2;
const LEFT_HALF_W = 36;
const RIGHT_HALF_W = 60;
const GAP = 60;
const LEFT_CX = -(LEFT_HALF_W + GAP / 2 + RIGHT_HALF_W) + LEFT_HALF_W;
const RIGHT_CX = LEFT_CX + LEFT_HALF_W + GAP + RIGHT_HALF_W;

export function TransmissionPoulieCourroie(props: LiaisonComponentProps) {
  const { view = 1, colorA = '#1a1a1a', colorB = '#1a1a1a' } = props;
  const strokeWidth = 1.5;

  const leftL = LEFT_CX - LEFT_HALF_W;
  const leftR = LEFT_CX + LEFT_HALF_W;
  const rightL = RIGHT_CX - RIGHT_HALF_W;
  const rightR = RIGHT_CX + RIGHT_HALF_W;

  const hY = HORIZONTAL_Y;
  const capBot = HORIZONTAL_Y + CAP_LEN;
  const beltY = hY + 6;
  const beltColor = '#22c55e';

  if (view === 2) {
    const r1 = LEFT_HALF_W;
    const r2 = RIGHT_HALF_W;
    const G = GAP;
    const cxSmall = (r1 - r2 - (r1 + G + r2)) / 2;
    const cxBig = (r1 - r2 + (r1 + G + r2)) / 2;
    return (
      <LiaisonNode type="transmission_poulie_courroie" {...props}>
        <Line points={[cxSmall, -r1, cxBig, -r2]} stroke={beltColor} strokeWidth={strokeWidth} />
        <Line points={[cxSmall, r1, cxBig, r2]} stroke={beltColor} strokeWidth={strokeWidth} />
        <Circle x={cxSmall} y={0} radius={r1} fill="white" stroke={colorA} strokeWidth={strokeWidth} />
        <Circle x={cxBig} y={0} radius={r2} fill="white" stroke={colorB} strokeWidth={strokeWidth} />
      </LiaisonNode>
    );
  }

  return (
    <LiaisonNode type="transmission_poulie_courroie" {...props}>
      <Line
        points={[leftL, capBot, leftL, hY, leftR, hY, leftR, capBot]}
        stroke={colorA}
        strokeWidth={strokeWidth}
      />
      <Line
        points={[rightL, capBot, rightL, hY, rightR, hY, rightR, capBot]}
        stroke={colorB}
        strokeWidth={strokeWidth}
      />
      <Line
        points={[leftL, beltY, rightR, beltY]}
        stroke={beltColor}
        strokeWidth={strokeWidth}
      />
    </LiaisonNode>
  );
}
