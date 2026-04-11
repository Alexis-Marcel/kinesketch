import { Line } from 'react-konva';
import { LiaisonNode, type LiaisonComponentProps } from './LiaisonNode';

export function Encastrement(props: LiaisonComponentProps) {
  const { colorA = '#1a1a1a' } = props;
  const strokeWidth = 1.5;

  return (
    <LiaisonNode type="encastrement" {...props}>
      <Line points={[-32, 0, 32, 0]} stroke={colorA} strokeWidth={strokeWidth} />
    </LiaisonNode>
  );
}
