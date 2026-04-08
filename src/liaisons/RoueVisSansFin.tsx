import { Group, Circle, Line, Rect, Shape } from 'react-konva';
import type Konva from 'konva';
import { snapPx } from '../utils/snap';
import { HitRect } from './HitRect';
import { BIG_GEAR_R } from './bounds';

interface RoueVisSansFinProps {
  x: number;
  y: number;
  rotation: number;
  scale?: number;
  view?: number;
  selected: boolean;
  colorA?: string;
  colorB?: string;
  onSelect: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDblClick: () => void;
}

// Visual layout — sized to match the order of magnitude of engrenage view 1.
// All coordinates are in the local pixel frame and shifted so the visual
// centroid sits on (0, 0): rotation/scale pivot around the centre, and the
// selection bounding box stays tight on both sides.
//
// Layout from top to bottom:
//   1. Wheel (full circle) — top
//   2. Top arc, concentric with the wheel but a few px larger, drawn as the
//      bottom slice of that circle so it hugs the wheel from below with a gap
//   3. Vertical worm shaft (line)
//   4. Bottom arc, mirror of the top arc, drawn as the top slice of a circle
//      below — same shape as the top arc but flipped
const WHEEL_CY = -62;
const WHEEL_R = 20;
const ARC_R = 26; // concentric with the wheel, only +6 → tight gap
const ARC_SPAN = 0.5; // half-angle (radians) of the visible arc slice
const TOP_ARC_BOTTOM_Y = WHEEL_CY + ARC_R; // = -36
const BOT_ARC_CY = 104;
const BOT_ARC_TOP_Y = BOT_ARC_CY - ARC_R; // = 78

export function RoueVisSansFin({
  x,
  y,
  rotation,
  scale = 1,
  view = 1,
  colorA = '#1a1a1a',
  colorB = '#1a1a1a',
  onSelect,
  onDragMove,
  onDragEnd,
  onDblClick,
}: RoueVisSansFinProps) {
  const strokeWidth = 1.5;

  const groupProps = {
    x,
    y,
    rotation,
    scaleX: scale,
    scaleY: scale,
    draggable: true,
    onClick: onSelect,
    onTap: onSelect,
    onDblClick,
    onDragMove: (e: Konva.KonvaEventObject<DragEvent>) => {
      const sx = snapPx(e.target.x());
      const sy = snapPx(e.target.y());
      e.target.x(sx);
      e.target.y(sy);
      onDragMove(sx, sy);
    },
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      const sx = snapPx(e.target.x());
      const sy = snapPx(e.target.y());
      e.target.x(sx);
      e.target.y(sy);
      onDragEnd(sx, sy);
    },
  };

  if (view === 2) {
    // Big wheel circle (A) with a horizontal rectangle (worm cross-section, B)
    // tangent to its top — same idea as engrenage_ext view 2 but with a
    // rectangle instead of a small circle.
    const r = BIG_GEAR_R;
    const rectW = 70;
    const rectH = 34;
    // Center the (rect + circle) stack on the node origin: total height is
    // rectH + 2r, so the wheel center sits at half that minus r.
    const cyCircle = (rectH + 2 * r) / 2 - r; // = 17
    const rectTop = cyCircle - r - rectH; // = -75
    const rectCY = rectTop + rectH / 2;
    const crossArm = 5;
    return (
      <Group {...groupProps}>
        <HitRect type="roue_vis_sans_fin" view={view} />
        <Rect
          x={-rectW / 2}
          y={rectTop}
          width={rectW}
          height={rectH}
          fill="white"
          stroke={colorB}
          strokeWidth={strokeWidth}
        />
        {/* Small × marking the rectangle center */}
        <Line
          points={[-crossArm, rectCY - crossArm, crossArm, rectCY + crossArm]}
          stroke={colorB}
          strokeWidth={strokeWidth}
        />
        <Line
          points={[-crossArm, rectCY + crossArm, crossArm, rectCY - crossArm]}
          stroke={colorB}
          strokeWidth={strokeWidth}
        />
        <Circle
          x={0}
          y={cyCircle}
          radius={r}
          fill="white"
          stroke={colorA}
          strokeWidth={strokeWidth}
        />
      </Group>
    );
  }

  return (
    <Group {...groupProps}>
      <HitRect type="roue_vis_sans_fin" view={view} />

      {/* Wheel — main circle (A) */}
      <Circle
        x={0}
        y={WHEEL_CY}
        radius={WHEEL_R}
        fill="white"
        stroke={colorA}
        strokeWidth={strokeWidth}
      />

      {/* Top arc — concentric with the wheel, slightly larger, only the bottom
          slice drawn so it hugs the wheel from below with a small gap. */}
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.arc(0, WHEEL_CY, ARC_R, Math.PI / 2 - ARC_SPAN, Math.PI / 2 + ARC_SPAN);
          ctx.strokeShape(shape);
        }}
        stroke={colorB}
        strokeWidth={strokeWidth}
      />

      {/* Vertical worm shaft */}
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.moveTo(0, TOP_ARC_BOTTOM_Y);
          ctx.lineTo(0, BOT_ARC_TOP_Y);
          ctx.strokeShape(shape);
        }}
        stroke={colorB}
        strokeWidth={strokeWidth}
      />

      {/* Bottom arc — mirror of the top arc: top slice of a circle whose
          center sits below the line end, so the curve points downward (∩). */}
      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.arc(0, BOT_ARC_CY, ARC_R, -Math.PI / 2 - ARC_SPAN, -Math.PI / 2 + ARC_SPAN);
          ctx.strokeShape(shape);
        }}
        stroke={colorB}
        strokeWidth={strokeWidth}
      />
    </Group>
  );
}
