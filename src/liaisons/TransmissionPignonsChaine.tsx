import { Arrow, Circle, Group, Line } from 'react-konva';
import type Konva from 'konva';
import { snapPx } from '../utils/snap';
import { HitRect } from './HitRect';

interface TransmissionPignonsChaineProps {
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

// Same horizontal proportions as TransmissionPoulieCourroie so the two
// transmission liaisons have a consistent footprint.
const LEFT_HALF_W = 36;
const RIGHT_HALF_W = 60;
const GAP = 60;
const LEFT_CX = -(LEFT_HALF_W + GAP / 2 + RIGHT_HALF_W) + LEFT_HALF_W; // = -90
const RIGHT_CX = LEFT_CX + LEFT_HALF_W + GAP + RIGHT_HALF_W; // = 66

const CHAIN_COLOR = '#22c55e';
const CHAIN_DASH: [number, number] = [6, 4];

export function TransmissionPignonsChaine({
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
}: TransmissionPignonsChaineProps) {
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
    // Two pulley-like circles connected by a dashed chain (top + bottom).
    // Diameters and spacing match the view-1 horizontal segments.
    const r1 = LEFT_HALF_W;
    const r2 = RIGHT_HALF_W;
    const G = GAP;
    const cxSmall = (r1 - r2 - (r1 + G + r2)) / 2;
    const cxBig = (r1 - r2 + (r1 + G + r2)) / 2;
    return (
      <Group {...groupProps}>
        <HitRect type="transmission_pignons_chaine" view={view} />
        {/* Chain — drawn first so circles mask the overlap; dashed for chain */}
        <Line
          points={[cxSmall, -r1, cxBig, -r2]}
          stroke={CHAIN_COLOR}
          strokeWidth={strokeWidth}
          dash={CHAIN_DASH}
        />
        <Line
          points={[cxSmall, r1, cxBig, r2]}
          stroke={CHAIN_COLOR}
          strokeWidth={strokeWidth}
          dash={CHAIN_DASH}
        />
        <Circle x={cxSmall} y={0} radius={r1} fill="white" stroke={colorA} strokeWidth={strokeWidth} />
        <Circle x={cxBig} y={0} radius={r2} fill="white" stroke={colorB} strokeWidth={strokeWidth} />
      </Group>
    );
  }

  // View 1: two horizontal segments with arrowheads at both ends, and a
  // dashed green chain at the SAME y level — visible only in the gap between
  // them (the arrow segments cover it elsewhere).
  const leftL = LEFT_CX - LEFT_HALF_W;
  const leftR = LEFT_CX + LEFT_HALF_W;
  const rightL = RIGHT_CX - RIGHT_HALF_W;
  const rightR = RIGHT_CX + RIGHT_HALF_W;
  return (
    <Group {...groupProps}>
      <HitRect type="transmission_pignons_chaine" view={view} />

      {/* Chain in the gap (dashed green at same y as the arrows) */}
      <Line
        points={[leftR, 0, rightL, 0]}
        stroke={CHAIN_COLOR}
        strokeWidth={strokeWidth}
        dash={CHAIN_DASH}
      />

      {/* Left pignon (A) — double-ended arrow */}
      <Arrow
        points={[leftL, 0, leftR, 0]}
        stroke={colorA}
        fill={colorA}
        strokeWidth={strokeWidth}
        pointerLength={6}
        pointerWidth={6}
        pointerAtBeginning
        pointerAtEnding
      />

      {/* Right pignon (B) — double-ended arrow */}
      <Arrow
        points={[rightL, 0, rightR, 0]}
        stroke={colorB}
        fill={colorB}
        strokeWidth={strokeWidth}
        pointerLength={6}
        pointerWidth={6}
        pointerAtBeginning
        pointerAtEnding
      />
    </Group>
  );
}
