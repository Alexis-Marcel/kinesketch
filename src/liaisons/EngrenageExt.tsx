import { Group, Line, Circle } from 'react-konva';
import { snap } from '../utils/snap';

interface EngrenageExtProps {
  x: number;
  y: number;
  rotation: number;
  view?: number;
  selected: boolean;
  colorA?: string;
  colorB?: string;
  onSelect: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDblClick: () => void;
}

export function EngrenageExt({ x, y, rotation, view = 1, colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: EngrenageExtProps) {
  const strokeWidth = 1.5;

  const groupProps = {
    x,
    y,
    rotation,
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
    // Two externally tangent circles — small on top, big on bottom
    const r1 = 8; // small gear radius
    const r2 = 14; // big gear radius
    const cy1 = -r1; // small circle center
    const cy2 = r2; // big circle center (tangent at y=0)
    return (
      <Group {...groupProps}>
        <Circle x={0} y={cy1} radius={r1} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
        <Circle x={0} y={cy2} radius={r2} stroke={colorB} strokeWidth={strokeWidth} fill="white" />
      </Group>
    );
  }

  const flangeW = 3;
  const y1 = -20;
  const y2 = -4;
  const y3 = 20;
  const o = strokeWidth / 2; // décalage perpendiculaire

  return (
    <Group {...groupProps}>
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
