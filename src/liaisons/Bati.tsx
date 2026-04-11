import { Line } from 'react-konva';
import { LiaisonNode, type LiaisonComponentProps } from './LiaisonNode';

export function Bati(props: LiaisonComponentProps) {
  const color = props.colorA ?? '#374151';
  const strokeWidth = 1.5;

  return (
    <LiaisonNode type="bati" {...props}>
      <Line points={[-22, -4, 22, -4]} stroke={color} strokeWidth={strokeWidth} />
      {/* Diagonal hatching strokes (ISO 3952) */}
      {[-16, -10, -4, 2, 8, 14].map((offset) => (
        <Line
          key={offset}
          points={[offset, -4, offset - 7, 4]}
          stroke={color}
          strokeWidth={1.2}
        />
      ))}
    </LiaisonNode>
  );
}
