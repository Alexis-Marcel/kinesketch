import { Circle, Line, Rect, Shape } from 'react-konva';
import { LiaisonNode, type LiaisonComponentProps } from './LiaisonNode';
import { BIG_GEAR_R } from './bounds';

// Visual layout — sized to match the order of magnitude of engrenage view 1.
// Layout from top to bottom:
//   1. Wheel (full circle) — top
//   2. Top arc, concentric with the wheel but a few px larger
//   3. Vertical worm shaft (line)
//   4. Bottom arc, mirror of the top arc
const WHEEL_CY = -62;
const WHEEL_R = 20;
const ARC_R = 26;
const ARC_SPAN = 0.5;
const TOP_ARC_BOTTOM_Y = WHEEL_CY + ARC_R;
const BOT_ARC_CY = 104;
const BOT_ARC_TOP_Y = BOT_ARC_CY - ARC_R;

export function RoueVisSansFin(props: LiaisonComponentProps) {
  const { view = 1, colorA = '#1a1a1a', colorB = '#1a1a1a' } = props;
  const strokeWidth = 1.5;

  if (view === 2) {
    const r = BIG_GEAR_R;
    const rectW = 70;
    const rectH = 34;
    const cyCircle = (rectH + 2 * r) / 2 - r;
    const rectTop = cyCircle - r - rectH;
    const rectCY = rectTop + rectH / 2;
    const crossArm = 5;
    return (
      <LiaisonNode type="roue_vis_sans_fin" {...props}>
        <Rect
          x={-rectW / 2}
          y={rectTop}
          width={rectW}
          height={rectH}
          fill="white"
          stroke={colorB}
          strokeWidth={strokeWidth}
        />
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
      </LiaisonNode>
    );
  }

  return (
    <LiaisonNode type="roue_vis_sans_fin" {...props}>
      <Circle
        x={0}
        y={WHEEL_CY}
        radius={WHEEL_R}
        fill="white"
        stroke={colorA}
        strokeWidth={strokeWidth}
      />

      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.arc(0, WHEEL_CY, ARC_R, Math.PI / 2 - ARC_SPAN, Math.PI / 2 + ARC_SPAN);
          ctx.strokeShape(shape);
        }}
        stroke={colorB}
        strokeWidth={strokeWidth}
      />

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

      <Shape
        sceneFunc={(ctx, shape) => {
          ctx.beginPath();
          ctx.arc(0, BOT_ARC_CY, ARC_R, -Math.PI / 2 - ARC_SPAN, -Math.PI / 2 + ARC_SPAN);
          ctx.strokeShape(shape);
        }}
        stroke={colorB}
        strokeWidth={strokeWidth}
      />
    </LiaisonNode>
  );
}
