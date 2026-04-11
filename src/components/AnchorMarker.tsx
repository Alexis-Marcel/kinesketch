import { Circle } from 'react-konva';
import type Konva from 'konva';
import type { AnchorPoint } from '../utils/anchors';

interface AnchorMarkerProps {
  anchor: AnchorPoint;
  centerX: number;
  centerY: number;
  scale: number;
  isActive: boolean;
  dotRadius?: number;
  onMouseDown?: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
  onClick?: (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => void;
}

/**
 * Visual marker for an anchor on a node. Renders a small dot for point
 * anchors, or a dashed circle outline at the anchor's actual radius for
 * circle-shape anchors — so the user sees they can attach a link anywhere on
 * the perimeter.
 */
export function AnchorMarker({
  anchor,
  centerX,
  centerY,
  scale,
  isActive,
  dotRadius = 4,
  onMouseDown,
  onClick,
}: AnchorMarkerProps) {
  const shape = anchor.shape ?? { kind: 'point' as const };
  const interactive = !!(onMouseDown || onClick);

  if (shape.kind === 'circle') {
    // Circle anchors render as a neutral gray "halo" around the actual shape:
    // a faint filled disc plus a dashed outline at radius + padding so the
    // snap zone is visually distinct from the node's own perimeter (which
    // already has its own stroke). The active state is conveyed by a separate
    // blue dot rendered at the snap position (see Canvas snap-point block).
    const VISUAL_PAD = 6; // px in screen space
    return (
      <Circle
        x={centerX}
        y={centerY}
        radius={shape.r * scale + VISUAL_PAD}
        fill="rgba(120, 120, 120, 0.08)"
        stroke="rgba(100, 100, 100, 0.7)"
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
