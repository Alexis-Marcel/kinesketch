import { Arrow, Circle, Group, Text } from 'react-konva';
import { snap } from '../utils/snap';
import type { Solide } from '../types';

interface LocalFrameRendererProps {
  solide: Solide;
  selected: boolean;
  onSelect: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDblClick: () => void;
}

export function LocalFrameRenderer({ solide, selected, onSelect, onDragMove, onDragEnd, onDblClick }: LocalFrameRendererProps) {
  if (!solide.showFrame) return null;

  const x = solide.frameX ?? 0;
  const y = solide.frameY ?? 0;
  const rotation = solide.frameRotation ?? 0;
  const color = solide.color;
  const label = solide.frameLabel ?? `R${solide.id.replace('s', '')}`;
  const len = 50;
  const strokeWidth = selected ? 2.5 : 2;
  const num = solide.id.replace('s', '');

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onDblClick}
      onDragMove={(e) => {
        const sx = snap(e.target.x());
        const sy = snap(e.target.y());
        e.target.x(sx);
        e.target.y(sy);
        onDragMove(sx, sy);
      }}
      onDragEnd={(e) => {
        const sx = snap(e.target.x());
        const sy = snap(e.target.y());
        e.target.x(sx);
        e.target.y(sy);
        onDragEnd(sx, sy);
      }}
    >
      {/* Origin point */}
      <Circle radius={3} fill={color} stroke={selected ? '#2563eb' : color} strokeWidth={1} />

      {/* X axis (pointing right) */}
      <Arrow
        points={[0, 0, len, 0]}
        stroke={color}
        strokeWidth={strokeWidth}
        fill={color}
        pointerLength={7}
        pointerWidth={6}
      />
      <Text
        x={len + 5}
        y={-7}
        text={`x${num}`}
        fontSize={13}
        fontFamily="Inter, system-ui, sans-serif"
        fontStyle="italic"
        fill={color}
      />

      {/* Y axis (pointing up) */}
      <Arrow
        points={[0, 0, 0, -len]}
        stroke={color}
        strokeWidth={strokeWidth}
        fill={color}
        pointerLength={7}
        pointerWidth={6}
      />
      <Text
        x={-16}
        y={-len - 10}
        text={`y${num}`}
        fontSize={13}
        fontFamily="Inter, system-ui, sans-serif"
        fontStyle="italic"
        fill={color}
      />

      {/* Origin label */}
      <Text
        x={-18}
        y={6}
        text={label}
        fontSize={12}
        fontFamily="Inter, system-ui, sans-serif"
        fontStyle="italic"
        fill={color}
      />
    </Group>
  );
}
