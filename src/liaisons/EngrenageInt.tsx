import { Group, Line, Circle } from 'react-konva';
import type Konva from 'konva';
import { snapPx } from '../utils/snap';
import { HitRect } from './HitRect';
import { BIG_GEAR_R } from './bounds';

interface EngrenageIntProps {
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

export function EngrenageInt({ x, y, rotation, scale = 1, view = 1,  colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: EngrenageIntProps) {
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
    // Small circle inside big circle
    const r1 = 24; // small gear radius
    const r2 = BIG_GEAR_R; // big gear radius (shared across gear-style liaisons)
    const cy1 = -(r2 - r1); // small circle center (inside, touching top)
    return (
      <Group {...groupProps}>
      <HitRect type="engrenage_int" view={view} />
        <Circle x={0} y={0} radius={r2} stroke={colorB} strokeWidth={strokeWidth} fill="white" />
        <Circle x={0} y={cy1} radius={r1} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
      </Group>
    );
  }

  // View 1: Left vertical (y1→y2) with 2 flanges (A) + hook "]" on right (B)
  // Between line 2 and 3: left vertical is empty
  // Hook = right vertical (y1→y3) with horizontal caps at top and bottom
  const flangeW = 7;
  const hookX = 24;
  const ox = -12; // x offset to center shape
  const y1 = -80;
  const yf1 = -64;
  const y2 = -16;
  const y3 = 80;
  const o = strokeWidth / 4;

  return (
    <Group {...groupProps}>
      <HitRect type="engrenage_int" view={view} />
      {/* Left vertical shaft (A) */}
      <Line points={[ox, y1, ox, y2]} stroke={colorA} strokeWidth={strokeWidth} />

      {/* Top flange — top half (B), bottom half (A) */}
      <Line points={[ox - flangeW, yf1 - o, ox + flangeW, yf1 - o]} stroke={colorB} strokeWidth={strokeWidth / 2} />
      <Line points={[ox - flangeW, yf1 + o, ox + flangeW, yf1 + o]} stroke={colorA} strokeWidth={strokeWidth / 2} />

      {/* Middle flange (A) — full colorA */}
      <Line points={[ox - flangeW, y2, ox + flangeW, y2]} stroke={colorA} strokeWidth={strokeWidth} />

      {/* Hook "]" shape (B) */}
      <Line points={[ox, yf1, ox, y1, hookX, y1, hookX, y3, ox, y3, ox, y3 - 32]} stroke={colorB} strokeWidth={strokeWidth} lineJoin="miter" />

      {/* Bottom flange (B) — full colorB */}
      <Line points={[ox - flangeW, y3 - 32, ox + flangeW, y3 - 32]} stroke={colorB} strokeWidth={strokeWidth} />
    </Group>
  );
}
