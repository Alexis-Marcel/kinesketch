import { Arrow, Group, Text } from 'react-konva';

interface AxisWidgetProps {
  x: number;
  y: number;
  scale: number;
}

export function AxisWidget({ x, y, scale }: AxisWidgetProps) {
  const len = 40;
  const inverseScale = 1 / scale;

  return (
    <Group x={x} y={y} scaleX={inverseScale} scaleY={inverseScale} listening={false}>
      {/* X axis (red, pointing right) */}
      <Arrow
        points={[0, 0, len, 0]}
        stroke="#dc2626"
        strokeWidth={2}
        fill="#dc2626"
        pointerLength={6}
        pointerWidth={5}
      />
      <Text
        x={len + 4}
        y={-6}
        text="x"
        fontSize={12}
        fontFamily="Inter, system-ui, sans-serif"
        fontStyle="italic"
        fill="#dc2626"
      />

      {/* Y axis (green, pointing up) */}
      <Arrow
        points={[0, 0, 0, -len]}
        stroke="#16a34a"
        strokeWidth={2}
        fill="#16a34a"
        pointerLength={6}
        pointerWidth={5}
      />
      <Text
        x={-14}
        y={-len - 8}
        text="y"
        fontSize={12}
        fontFamily="Inter, system-ui, sans-serif"
        fontStyle="italic"
        fill="#16a34a"
      />

      {/* Origin label */}
      <Text
        x={-14}
        y={4}
        text="O"
        fontSize={12}
        fontFamily="Inter, system-ui, sans-serif"
        fontStyle="italic"
        fill="#374151"
      />
    </Group>
  );
}
