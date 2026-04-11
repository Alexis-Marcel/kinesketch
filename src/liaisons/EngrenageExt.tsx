import { Line, Circle } from 'react-konva';
import { LiaisonNode, type LiaisonComponentProps } from './LiaisonNode';
import { BIG_GEAR_R } from './bounds';

export function EngrenageExt(props: LiaisonComponentProps) {
  const { view = 1, colorA = '#1a1a1a', colorB = '#1a1a1a' } = props;
  const strokeWidth = 1.5;

  if (view === 2) {
    // Two externally tangent circles — small on top, big on bottom
    const r1 = 34;
    const r2 = BIG_GEAR_R;
    const oy = -(r2 - r1);
    const cy1 = -r1 + oy;
    const cy2 = r2 + oy;
    return (
      <LiaisonNode type="engrenage_ext" {...props}>
        <Circle x={0} y={cy1} radius={r1} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
        <Circle x={0} y={cy2} radius={r2} stroke={colorB} strokeWidth={strokeWidth} fill="white" />
      </LiaisonNode>
    );
  }

  const flangeW = 7;
  const y1 = -80;
  const y2 = -16;
  const y3 = 80;
  const o = strokeWidth / 2;

  return (
    <LiaisonNode type="engrenage_ext" {...props}>
      {/* Vertical shaft — top half (A), bottom half (B) */}
      <Line points={[0, y1, 0, y2]} stroke={colorA} strokeWidth={strokeWidth} />
      <Line points={[0, y2, 0, y3]} stroke={colorB} strokeWidth={strokeWidth} />

      {/* Top flange (A) */}
      <Line points={[-flangeW, y1, flangeW, y1]} stroke={colorA} strokeWidth={strokeWidth} />

      {/* Middle flange — top half (A), bottom half (B), côte à côte */}
      <Line points={[-flangeW, y2 - o / 2, flangeW, y2 - o / 2]} stroke={colorA} strokeWidth={strokeWidth / 2} />
      <Line points={[-flangeW, y2 + o / 2, flangeW, y2 + o / 2]} stroke={colorB} strokeWidth={strokeWidth / 2} />

      {/* Bottom flange (B) */}
      <Line points={[-flangeW, y3, flangeW, y3]} stroke={colorB} strokeWidth={strokeWidth} />
    </LiaisonNode>
  );
}
