import { Group, Line, Rect } from 'react-konva';
import { snap } from '../utils/snap';

interface EncastrementProps {
  x: number;
  y: number;
  rotation: number;
  selected: boolean;
  onSelect: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDblClick: () => void;
}

export function Encastrement({ x, y, rotation, selected, onSelect, onDragMove, onDragEnd, onDblClick }: EncastrementProps) {
  const w = 36;
  const h = 10;
  const hatchSpacing = 6;
  const hatchLen = 8;
  const strokeColor = selected ? '#2563eb' : '#1a1a1a';
  const strokeWidth = selected ? 2.5 : 2;

  const hatches: number[][] = [];
  const count = Math.floor(w / hatchSpacing);
  for (let i = 0; i <= count; i++) {
    const xPos = -w / 2 + i * hatchSpacing;
    hatches.push([xPos, h / 2, xPos - hatchLen * 0.5, h / 2 + hatchLen]);
  }

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
      {hatches.map((points, i) => (
        <Line key={i} points={points} stroke={strokeColor} strokeWidth={1.5} />
      ))}
      <Line points={[0, -h / 2, 0, -h / 2 - 10]} stroke={strokeColor} strokeWidth={strokeWidth} />
    </Group>
  );
}
