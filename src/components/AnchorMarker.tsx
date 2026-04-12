import { Circle, Shape } from 'react-konva';
import type Konva from 'konva';
import type { AnchorPoint } from '../utils/anchors';

interface AnchorMarkerProps {
  anchor: AnchorPoint;
  centerX: number;
  centerY: number;
  scale: number;
  /** Node rotation in degrees — used to orient arc anchors correctly. */
  nodeRotation?: number;
  isActive: boolean;
  dotRadius?: number;
  onMouseDown?: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onClick?: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
}

/**
 * Visual marker for an anchor on a node. Renders a small dot for point
 * anchors, a dashed circle outline for circle anchors, and a dashed arc
 * outline for arc anchors — so the user sees exactly where they can attach
 * a link.
 */
export function AnchorMarker({
  anchor,
  centerX,
  centerY,
  scale,
  nodeRotation = 0,
  isActive,
  dotRadius = 4,
  onMouseDown,
  onClick,
}: AnchorMarkerProps) {
  const shape = anchor.shape ?? { kind: 'point' as const };
  const interactive = !!(onMouseDown || onClick);

  // Padding (in screen px) added to the visible radius so the dashed halo sits
  // just outside the node's own stroke.
  const VISUAL_PAD = 6;
  const haloFill = 'rgba(120, 120, 120, 0.08)';
  const haloStroke = 'rgba(100, 100, 100, 0.7)';

  if (shape.kind === 'circle') {
    return (
      <Circle
        x={centerX}
        y={centerY}
        radius={shape.r * scale + VISUAL_PAD}
        fill={haloFill}
        stroke={haloStroke}
        strokeWidth={1.3}
        dash={[5, 3]}
        listening={interactive}
        hitStrokeWidth={12}
        onMouseDown={onMouseDown}
        onClick={onClick}
        onTap={onClick}
      />
    );
  }

  if (shape.kind === 'arc') {
    const radius = shape.r * scale + VISUAL_PAD;
    const rotRad = (nodeRotation * Math.PI) / 180;
    const start = shape.startAngle + rotRad;
    const end = shape.endAngle + rotRad;
    return (
      <Shape
        x={centerX}
        y={centerY}
        sceneFunc={(ctx, self) => {
          ctx.beginPath();
          ctx.arc(0, 0, radius, start, end);
          ctx.strokeShape(self);
        }}
        stroke={haloStroke}
        strokeWidth={1.3}
        dash={[5, 3]}
        listening={interactive}
        hitStrokeWidth={12}
        onMouseDown={onMouseDown}
        onClick={onClick}
        onTap={onClick}
      />
    );
  }

  // Point anchor — small dot.
  const activeStroke = '#2563eb';
  const idleStroke = 'rgba(100, 100, 100, 0.5)';
  const activeFill = 'rgba(37, 99, 235, 0.4)';
  const idleFill = 'rgba(120, 120, 120, 0.2)';
  return (
    <Circle
      x={centerX}
      y={centerY}
      radius={dotRadius}
      fill={isActive ? activeFill : idleFill}
      stroke={isActive ? activeStroke : idleStroke}
      strokeWidth={1.2}
      listening={interactive}
      onMouseDown={onMouseDown}
      onClick={onClick}
      onTap={onClick}
    />
  );
}
