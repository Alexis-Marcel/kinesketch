import { Group, Line, Circle } from 'react-konva';
import type Konva from 'konva';
import { snapPx } from '../utils/snap';
import { HitRect } from './HitRect';
import { BIG_GEAR_R } from './bounds';

interface EngrenageExtProps {
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

export function EngrenageExt({ x, y, rotation, scale = 1, view = 1, colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: EngrenageExtProps) {
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
    // Two externally tangent circles — small on top, big on bottom
    const r1 = 34; // small gear radius
    const r2 = BIG_GEAR_R; // big gear radius (shared across gear-style liaisons)
    const oy = -(r2 - r1); // vertical offset to center bbox
    const cy1 = -r1 + oy; // small circle center
    const cy2 = r2 + oy; // big circle center
    return (
      <Group {...groupProps}>
      <HitRect type="engrenage_ext" view={view} />
        <Circle x={0} y={cy1} radius={r1} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
        <Circle x={0} y={cy2} radius={r2} stroke={colorB} strokeWidth={strokeWidth} fill="white" />
      </Group>
    );
  }

  const flangeW = 7;
  const y1 = -80;
  const y2 = -16;
  const y3 = 80;
  const o = strokeWidth / 2; // décalage perpendiculaire

  return (
    <Group {...groupProps}>
      <HitRect type="engrenage_ext" view={view} />
      {/* Vertical shaft — top half (A), bottom half (B) */}
      <Line points={[0, y1, 0, y2]} stroke={colorA} strokeWidth={strokeWidth} />
      <Line points={[0, y2, 0, y3]} stroke={colorB} strokeWidth={strokeWidth} />

      {/* Top flange (A) */}
      <Line points={[-flangeW, y1, flangeW, y1]} stroke={colorA} strokeWidth={strokeWidth} />

      {/* Middle flange — top half (A), bottom half (B), côte à côte */}
      <Line points={[-flangeW, y2 - o / 2, flangeW, y2 - o / 2]} stroke={colorA} strokeWidth={strokeWidth / 2} />
      <Line points={[-flangeW, y2 + o / 2, flangeW, y2 + o / 2]} stroke={colorB} strokeWidth={strokeWidth / 2} />

      {/* Bottom flange (B) */}
      <Line points={[-flangeW, y3, flangeW, y3]} stroke={colorB} strokeWidth={strokeWidth} />
    </Group>
  );
}
