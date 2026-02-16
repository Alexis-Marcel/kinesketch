import { Circle, Group, Line, Rect } from 'react-konva';
import { snap } from '../utils/snap';

interface PivotGlissantProps {
  x: number;
  y: number;
  rotation: number;
  selected: boolean;
  onSelect: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDblClick: () => void;
}

export function PivotGlissant({ x, y, rotation, selected, onSelect, onDragMove, onDragEnd, onDblClick }: PivotGlissantProps) {
  const r = 10;
  const w = 30;
  const h = 24;
  const guideExtend = 14;
  const guideGap = 4;
  const strokeColor = selected ? '#2563eb' : '#1a1a1a';
  const strokeWidth = selected ? 2.5 : 2;

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation}
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
      <Rect
        x={-w / 2}
        y={-h / 2}
        width={w}
        height={h}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="white"
      />
      <Line
        points={[-(w / 2 + guideExtend), -(h / 2 + guideGap), w / 2 + guideExtend, -(h / 2 + guideGap)]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      <Line
        points={[-(w / 2 + guideExtend), h / 2 + guideGap, w / 2 + guideExtend, h / 2 + guideGap]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
      />
      <Circle radius={r} stroke={strokeColor} strokeWidth={strokeWidth} fill="white" />
      <Circle radius={2.5} fill={strokeColor} />
    </Group>
  );
}
