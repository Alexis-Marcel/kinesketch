import { Circle, Line } from 'react-konva';
import { LiaisonNode, type LiaisonComponentProps } from './LiaisonNode';

export function Rotule(props: LiaisonComponentProps) {
  const { colorA = '#1a1a1a', colorB = '#1a1a1a' } = props;
  const r = 12;
  const strokeWidth = 1.5;

  return (
    <LiaisonNode type="rotule" {...props}>
      {/* Inner circle (A) + 3/4 outer circle opening right (B) */}
      <Circle radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
      <Line
        points={Array.from({ length: 25 }, (_, i) => {
          const a = Math.PI / 4 + (3 * Math.PI / 2) * i / 24;
          return [15 * Math.cos(a), 15 * Math.sin(a)];
        }).flat()}
        stroke={colorB}
        strokeWidth={strokeWidth}
      />
    </LiaisonNode>
  );
}
