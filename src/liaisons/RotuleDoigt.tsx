import { Circle, Line } from 'react-konva';
import { LiaisonNode, type LiaisonComponentProps } from './LiaisonNode';

export function RotuleDoigt(props: LiaisonComponentProps) {
  const { colorA = '#1a1a1a', colorB = '#1a1a1a' } = props;
  const r = 12;
  const cos45 = Math.cos(Math.PI / 4);
  const sin45 = Math.sin(Math.PI / 4);
  const strokeWidth = 1.5;

  return (
    <LiaisonNode type="rotule_doigt" {...props}>
      {/* Inner circle (A) + 3/4 outer circle opening right (B) + doigt line (A) */}
      <Circle radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
      <Line
        points={Array.from({ length: 25 }, (_, i) => {
          const a = Math.PI / 4 + (3 * Math.PI / 2) * i / 24;
          return [15 * Math.cos(a), 15 * Math.sin(a)];
        }).flat()}
        stroke={colorB}
        strokeWidth={strokeWidth}
      />
      {/* Doigt: line from inner circle edge at lower-left, through outer circle */}
      <Line
        points={[-r * cos45, r * sin45, -20 * cos45, 20 * sin45]}
        stroke={colorA}
        strokeWidth={strokeWidth}
      />
    </LiaisonNode>
  );
}
