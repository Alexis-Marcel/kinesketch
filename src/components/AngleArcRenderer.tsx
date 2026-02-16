import { Arc, Group, Line, Text, Circle } from 'react-konva';
import { snap } from '../utils/snap';
import type { AngleArc, Solide } from '../types';

interface AngleArcRendererProps {
  arc: AngleArc;
  fromSolide: Solide;
  toSolide: Solide;
  selected: boolean;
  onSelect: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDblClick: () => void;
  onLabelDragEnd: (ox: number, oy: number) => void;
}

export function AngleArcRenderer({ arc, fromSolide, toSolide, selected, onSelect, onDragMove, onDragEnd, onDblClick, onLabelDragEnd }: AngleArcRendererProps) {
  const fromAngle = fromSolide.frameRotation ?? 0;
  const toAngle = toSolide.frameRotation ?? 0;

  // Sweep from "from" frame to "to" frame
  let sweep = toAngle - fromAngle;
  // Normalize to [-180, 180]
  while (sweep > 180) sweep -= 360;
  while (sweep < -180) sweep += 360;

  const strokeColor = selected ? '#2563eb' : '#374151';
  const strokeWidth = selected ? 2.5 : 1.5;
  const r = arc.radius;

  // Konva Arc uses rotation (from 3 o'clock) and angle (clockwise).
  // Our "start" is from the Y-up axis rotated by fromAngle.
  // Convert: Konva rotation = fromAngle - 90 (since 0° in our system is up = -Y)
  const konvaStart = sweep >= 0 ? fromAngle - 90 : fromAngle + sweep - 90;
  const konvaAngle = Math.abs(sweep);

  // Arrow tip at end of arc
  const endRad = (fromAngle + sweep - 90) * Math.PI / 180;
  const ex = r * Math.cos(endRad);
  const ey = r * Math.sin(endRad);
  // Tangent direction for arrow head
  const tangentAngle = sweep >= 0 ? endRad + Math.PI / 2 : endRad - Math.PI / 2;
  const arrowSize = 7;
  const ax1 = ex + arrowSize * Math.cos(tangentAngle + 2.7);
  const ay1 = ey + arrowSize * Math.sin(tangentAngle + 2.7);
  const ax2 = ex + arrowSize * Math.cos(tangentAngle - 2.7);
  const ay2 = ey + arrowSize * Math.sin(tangentAngle - 2.7);

  // Reference lines along start and end angles
  const startRad = (fromAngle - 90) * Math.PI / 180;
  const lineLen = r + 10;
  const sx1 = lineLen * Math.cos(startRad);
  const sy1 = lineLen * Math.sin(startRad);
  const ex2 = lineLen * Math.cos(endRad);
  const ey2 = lineLen * Math.sin(endRad);

  // Label position at the middle of the arc
  const midAngleRad = (fromAngle + sweep / 2 - 90) * Math.PI / 180;
  const labelBaseX = (r + 14) * Math.cos(midAngleRad);
  const labelBaseY = (r + 14) * Math.sin(midAngleRad);

  return (
    <Group
      x={arc.x}
      y={arc.y}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onDblClick}
      onDragMove={(e) => {
        const sx = snap(e.target.x());
        const sy = snap(e.target.y());
        e.target.x(sx);
        e.target.y(sy);
        onDragMove(sx, sy);
      }}
      onDragEnd={(e) => {
        const sx = snap(e.target.x());
        const sy = snap(e.target.y());
        e.target.x(sx);
        e.target.y(sy);
        onDragEnd(sx, sy);
      }}
    >
      {/* Origin dot */}
      <Circle radius={2.5} fill={strokeColor} />

      {/* Reference line: from-angle direction */}
      <Line
        points={[0, 0, sx1, sy1]}
        stroke={strokeColor}
        strokeWidth={1}
        dash={[4, 3]}
        opacity={0.5}
        listening={false}
      />

      {/* Reference line: to-angle direction */}
      <Line
        points={[0, 0, ex2, ey2]}
        stroke={strokeColor}
        strokeWidth={1}
        dash={[4, 3]}
        opacity={0.5}
        listening={false}
      />

      {/* The arc */}
      {konvaAngle > 0.5 && (
        <Arc
          x={0}
          y={0}
          innerRadius={r}
          outerRadius={r}
          angle={konvaAngle}
          rotation={konvaStart}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
      )}

      {/* Arrow head at end of arc */}
      {konvaAngle > 0.5 && (
        <Line
          points={[ax1, ay1, ex, ey, ax2, ay2]}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          listening={false}
        />
      )}

      {/* Draggable label */}
      <Text
        x={labelBaseX + arc.labelOffsetX}
        y={labelBaseY + arc.labelOffsetY}
        text={arc.label}
        fontSize={14}
        fontFamily="Inter, system-ui, sans-serif"
        fontStyle="italic"
        fill={strokeColor}
        draggable
        onDragEnd={(e) => {
          const ox = e.target.x() - labelBaseX;
          const oy = e.target.y() - labelBaseY;
          e.target.x(labelBaseX + ox);
          e.target.y(labelBaseY + oy);
          onLabelDragEnd(ox, oy);
        }}
      />
    </Group>
  );
}
