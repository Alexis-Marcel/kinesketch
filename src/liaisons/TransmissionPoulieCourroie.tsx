import { Group, Circle, Line } from 'react-konva';
import type Konva from 'konva';
import { snapPx } from '../utils/snap';
import { HitRect } from './HitRect';

interface TransmissionPoulieCourroieProps {
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

// View 1 layout — two pulleys side by side: a horizontal segment with a short
// vertical cap at each end, the caps extending only DOWNWARD from the bar.
// Right pulley has a longer horizontal bar (representing the larger pulley).
// The whole shape is shifted vertically so the bbox is centered on the node
// origin.
const CAP_LEN = 18;     // length of the vertical end caps (downward only)
const HORIZONTAL_Y = -CAP_LEN / 2; // = -9 — shifts shape so bbox centers on (0,0)
const LEFT_HALF_W = 36;   // half-width of the smaller (left) pulley
const RIGHT_HALF_W = 60;  // half-width of the larger (right) pulley
const GAP = 60;           // horizontal gap between the two pulleys
// Center positions worked out so the overall bbox is centered:
//   total width = 2*LEFT_HALF_W + GAP + 2*RIGHT_HALF_W = 252
//   left pulley spans [-126, -54], right pulley spans [6, 126]
const LEFT_CX = -(LEFT_HALF_W + GAP / 2 + RIGHT_HALF_W) + LEFT_HALF_W; // = -90
const RIGHT_CX = LEFT_CX + LEFT_HALF_W + GAP + RIGHT_HALF_W; // = 66

export function TransmissionPoulieCourroie({
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
}: TransmissionPoulieCourroieProps) {
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

  const leftL = LEFT_CX - LEFT_HALF_W;
  const leftR = LEFT_CX + LEFT_HALF_W;
  const rightL = RIGHT_CX - RIGHT_HALF_W;
  const rightR = RIGHT_CX + RIGHT_HALF_W;

  const hY = HORIZONTAL_Y;
  const capBot = HORIZONTAL_Y + CAP_LEN;

  // Belt: a green line just below the horizontal bars, spanning from the
  // outer edge of the left pulley to the outer edge of the right pulley.
  const beltY = hY + 6;
  const beltColor = '#22c55e';

  if (view === 2) {
    // Two circles side by side connected by two green belt lines (top-to-top
    // and bottom-to-bottom). Belt is drawn first so the white-filled circles
    // mask the parts where it would enter them — visually the belt passes
    // behind the pulleys.
    //
    // Diameters and spacing mirror the view-1 horizontal bar lengths and gap
    // so the two views share the same overall footprint.
    const r1 = LEFT_HALF_W;   // = 36 → small pulley diameter = view-1 left bar
    const r2 = RIGHT_HALF_W;  // = 60 → big pulley diameter = view-1 right bar
    const G = GAP;            // = 60 → gap matches view-1 gap
    // Solve: cx_small + cx_big = r1 - r2 and cx_big - cx_small = r1 + G + r2
    const cxSmall = (r1 - r2 - (r1 + G + r2)) / 2;
    const cxBig = (r1 - r2 + (r1 + G + r2)) / 2;
    return (
      <Group {...groupProps}>
        <HitRect type="transmission_poulie_courroie" view={view} />
        {/* Belt — drawn first so circles render on top and mask the overlap */}
        <Line
          points={[cxSmall, -r1, cxBig, -r2]}
          stroke={beltColor}
          strokeWidth={strokeWidth}
        />
        <Line
          points={[cxSmall, r1, cxBig, r2]}
          stroke={beltColor}
          strokeWidth={strokeWidth}
        />
        {/* Small pulley (A) */}
        <Circle x={cxSmall} y={0} radius={r1} fill="white" stroke={colorA} strokeWidth={strokeWidth} />
        {/* Big pulley (B) */}
        <Circle x={cxBig} y={0} radius={r2} fill="white" stroke={colorB} strokeWidth={strokeWidth} />
      </Group>
    );
  }

  return (
    <Group {...groupProps}>
      <HitRect type="transmission_poulie_courroie" view={view} />

      {/* Left pulley (A) — single polyline: bottom-left → top-left → top-right → bottom-right */}
      <Line
        points={[leftL, capBot, leftL, hY, leftR, hY, leftR, capBot]}
        stroke={colorA}
        strokeWidth={strokeWidth}
      />

      {/* Right pulley (B) — same shape, larger horizontal bar */}
      <Line
        points={[rightL, capBot, rightL, hY, rightR, hY, rightR, capBot]}
        stroke={colorB}
        strokeWidth={strokeWidth}
      />

      {/* Belt — green line connecting the outer edges of the two pulleys */}
      <Line
        points={[leftL, beltY, rightR, beltY]}
        stroke={beltColor}
        strokeWidth={strokeWidth}
      />
    </Group>
  );
}
