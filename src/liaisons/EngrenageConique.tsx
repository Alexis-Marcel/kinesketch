import { Group, Line, Circle , Rect } from 'react-konva';
import { snap } from '../utils/snap';

interface EngrenageConiqueProps {
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

export function EngrenageConique({ x, y, rotation, scale = 1, view = 1,  colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: EngrenageConiqueProps) {
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
    onDragMove: (e: any) => {
      const sx = snap(e.target.x());
      const sy = snap(e.target.y());
      e.target.x(sx);
      e.target.y(sy);
      onDragMove(sx, sy);
    },
    onDragEnd: (e: any) => {
      const sx = snap(e.target.x());
      const sy = snap(e.target.y());
      e.target.x(sx);
      e.target.y(sy);
      onDragEnd(sx, sy);
    },
  };

  if (view === 2) {
    // Circle with vertical line + angled flanges on the left
    const r = 14;
    const vx = -r; // vertical line touching circle
    const vLen = 12; // half-length of vertical line
    const f = 2;     // flange half-size
    return (
      <Group {...groupProps}>
      <Rect x={-26} y={-26} width={52} height={52} fill="transparent" />
        <Circle x={0} y={0} radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
        {/* Vertical line touching left of circle */}
        <Line points={[vx, -vLen, vx, vLen]} stroke={colorB} strokeWidth={strokeWidth} />
        {/* Top flange at 45° \ */}
        <Line points={[vx - f, -vLen - f, vx + f, -vLen + f]} stroke={colorB} strokeWidth={strokeWidth} />
        {/* Bottom flange at 45° / */}
        <Line points={[vx - f, vLen + f, vx + f, vLen - f]} stroke={colorB} strokeWidth={strokeWidth} />
      </Group>
    );
  }

  // View 1: L-shape (right angle to the right) with 45° flanges
  // Vertical part (A), horizontal part (B), angle at center
  const len = 20;
  const f = 2;
  const o = strokeWidth / (4 * Math.sqrt(2)); // ≈ 0.265

  return (
    <Group {...groupProps}>
      <Rect x={-26} y={-26} width={52} height={52} fill="transparent" />
      {/* Horizontal arm (A) */}
      <Line points={[len/2, -len/2, -len/2, -len/2]} stroke={colorA} strokeWidth={strokeWidth} />
      {/* Vertical arm (B) */}
      <Line points={[-len/2, -len/2, -len/2, len/2]} stroke={colorB} strokeWidth={strokeWidth} />
      {/* Flange at end of horizontal arm (A) */}
      <Line points={[len/2 - f, -len/2 + f, len/2 + f, -len/2 - f]} stroke={colorA} strokeWidth={strokeWidth} />
      {/* Flange angle — A (top-right) */}
      <Line points={[-len/2-f+o, -len/2-f-o, -len/2+f+o, -len/2+f-o]} stroke={colorA} strokeWidth={strokeWidth/2} />
      {/* Flange angle — B (bottom-left) */}
      <Line points={[-len/2-f-o, -len/2-f+o, -len/2+f-o, -len/2+f+o]} stroke={colorB} strokeWidth={strokeWidth/2} />
      {/* Flange at end of vertical arm (B) */}
      <Line points={[-len/2 - f, len/2 + f, -len/2 + f, len/2 - f]} stroke={colorB} strokeWidth={strokeWidth} />
    </Group>
  );
}
