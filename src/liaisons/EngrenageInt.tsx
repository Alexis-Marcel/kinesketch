import { Group, Line, Circle , Rect } from 'react-konva';
import { snap } from '../utils/snap';

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
    // Small circle inside big circle
    const r1 = 6; // small gear radius
    const r2 = 14; // big gear radius
    const cy1 = -(r2 - r1); // small circle center (inside, touching top)
    return (
      <Group {...groupProps}>
      <Rect x={-26} y={-26} width={52} height={52} fill="transparent" />
        <Circle x={0} y={0} radius={r2} stroke={colorB} strokeWidth={strokeWidth} fill="white" />
        <Circle x={0} y={cy1} radius={r1} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
      </Group>
    );
  }

  // View 1: Left vertical (y1→y2) with 2 flanges (A) + hook "]" on right (B)
  // Between line 2 and 3: left vertical is empty
  // Hook = right vertical (y1→y3) with horizontal caps at top and bottom
  const flangeW = 3;
  const hookX = 6;
  const ox = -3; // x offset to center shape
  const y1 = -20;
  const yf1 = -16;
  const y2 = -4;
  const y3 = 20;
  const o = strokeWidth / 4;

  return (
    <Group {...groupProps}>
      <Rect x={-26} y={-26} width={52} height={52} fill="transparent" />
      {/* Left vertical shaft (A) */}
      <Line points={[ox, y1, ox, y2]} stroke={colorA} strokeWidth={strokeWidth} />

      {/* Top flange — top half (B), bottom half (A) */}
      <Line points={[ox - flangeW, yf1 - o, ox + flangeW, yf1 - o]} stroke={colorB} strokeWidth={strokeWidth / 2} />
      <Line points={[ox - flangeW, yf1 + o, ox + flangeW, yf1 + o]} stroke={colorA} strokeWidth={strokeWidth / 2} />

      {/* Middle flange (A) — full colorA */}
      <Line points={[ox - flangeW, y2, ox + flangeW, y2]} stroke={colorA} strokeWidth={strokeWidth} />

      {/* Hook "]" shape (B) */}
      <Line points={[ox, yf1, ox, y1, hookX, y1, hookX, y3, ox, y3, ox, y3 - 8]} stroke={colorB} strokeWidth={strokeWidth} lineJoin="miter" />

      {/* Bottom flange (B) — full colorB */}
      <Line points={[ox - flangeW, y3 - 8, ox + flangeW, y3 - 8]} stroke={colorB} strokeWidth={strokeWidth} />
    </Group>
  );
}
