import { Line, Circle } from 'react-konva';
import { LiaisonNode, type LiaisonComponentProps } from './LiaisonNode';
import { BIG_GEAR_R } from './bounds';

export function EngrenageConique(props: LiaisonComponentProps) {
  const { view = 1, colorA = '#1a1a1a', colorB = '#1a1a1a' } = props;
  const strokeWidth = 1.5;

  if (view === 2) {
    const r = BIG_GEAR_R;
    const vx = -r;
    const vLen = 50;
    const f = 8;
    return (
      <LiaisonNode type="engrenage_conique" {...props}>
        <Circle x={0} y={0} radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
        <Line points={[vx, -vLen, vx, vLen]} stroke={colorB} strokeWidth={strokeWidth} />
        <Line points={[vx - f, -vLen - f, vx + f, -vLen + f]} stroke={colorB} strokeWidth={strokeWidth} />
        <Line points={[vx - f, vLen + f, vx + f, vLen - f]} stroke={colorB} strokeWidth={strokeWidth} />
      </LiaisonNode>
    );
  }

  const len = 80;
  const f = 7;
  const o = strokeWidth / (4 * Math.sqrt(2));

  return (
    <LiaisonNode type="engrenage_conique" {...props}>
      <Line points={[len / 2, -len / 2, -len / 2, -len / 2]} stroke={colorA} strokeWidth={strokeWidth} />
      <Line points={[-len / 2, -len / 2, -len / 2, len / 2]} stroke={colorB} strokeWidth={strokeWidth} />
      <Line points={[len / 2 - f, -len / 2 + f, len / 2 + f, -len / 2 - f]} stroke={colorA} strokeWidth={strokeWidth} />
      <Line points={[-len / 2 - f + o, -len / 2 - f - o, -len / 2 + f + o, -len / 2 + f - o]} stroke={colorA} strokeWidth={strokeWidth / 2} />
      <Line points={[-len / 2 - f - o, -len / 2 - f + o, -len / 2 + f - o, -len / 2 + f + o]} stroke={colorB} strokeWidth={strokeWidth / 2} />
      <Line points={[-len / 2 - f, len / 2 + f, -len / 2 + f, len / 2 - f]} stroke={colorB} strokeWidth={strokeWidth} />
    </LiaisonNode>
  );
}
