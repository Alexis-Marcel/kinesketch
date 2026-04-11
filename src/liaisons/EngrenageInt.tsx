import { Line, Circle } from 'react-konva';
import { LiaisonNode, type LiaisonComponentProps } from './LiaisonNode';
import { BIG_GEAR_R } from './bounds';

export function EngrenageInt(props: LiaisonComponentProps) {
  const { view = 1, colorA = '#1a1a1a', colorB = '#1a1a1a' } = props;
  const strokeWidth = 1.5;

  if (view === 2) {
    const r1 = 24;
    const r2 = BIG_GEAR_R;
    const cy1 = -(r2 - r1);
    return (
      <LiaisonNode type="engrenage_int" {...props}>
        <Circle x={0} y={0} radius={r2} stroke={colorB} strokeWidth={strokeWidth} fill="white" />
        <Circle x={0} y={cy1} radius={r1} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
      </LiaisonNode>
    );
  }

  const flangeW = 7;
  const hookX = 24;
  const ox = -12;
  const y1 = -80;
  const yf1 = -64;
  const y2 = -16;
  const y3 = 80;
  const o = strokeWidth / 4;

  return (
    <LiaisonNode type="engrenage_int" {...props}>
      <Line points={[ox, y1, ox, y2]} stroke={colorA} strokeWidth={strokeWidth} />

      <Line points={[ox - flangeW, yf1 - o, ox + flangeW, yf1 - o]} stroke={colorB} strokeWidth={strokeWidth / 2} />
      <Line points={[ox - flangeW, yf1 + o, ox + flangeW, yf1 + o]} stroke={colorA} strokeWidth={strokeWidth / 2} />

      <Line points={[ox - flangeW, y2, ox + flangeW, y2]} stroke={colorA} strokeWidth={strokeWidth} />

      <Line points={[ox, yf1, ox, y1, hookX, y1, hookX, y3, ox, y3, ox, y3 - 32]} stroke={colorB} strokeWidth={strokeWidth} lineJoin="miter" />

      <Line points={[ox - flangeW, y3 - 32, ox + flangeW, y3 - 32]} stroke={colorB} strokeWidth={strokeWidth} />
    </LiaisonNode>
  );
}
