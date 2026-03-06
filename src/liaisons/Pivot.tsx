import { Circle, Group, Line, Rect } from 'react-konva';
import { snap } from '../utils/snap';

interface PivotProps {
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

export function Pivot({ x, y, rotation, scale = 1, view = 1,  colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: PivotProps) {
  const r = 12;
  const strokeWidth = 1.5;

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation} scaleX={scale} scaleY={scale}
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
      <Rect x={-26} y={-26} width={52} height={52} fill="transparent" />
      {view === 1 ? (
        <>
          {/* Plan view: rectangle (bearing=B) + horizontal shaft + vertical flanges (A) */}
          <Rect x={-22} y={-11} width={44} height={22} stroke={colorB} strokeWidth={strokeWidth} fill="white" />
          <Line points={[-34, 0, 34, 0]} stroke={colorA} strokeWidth={strokeWidth} />
          <Line points={[-34, -8, -34, 8]} stroke={colorA} strokeWidth={strokeWidth} />
          <Line points={[34, -8, 34, 8]} stroke={colorA} strokeWidth={strokeWidth} />
        </>
      ) : (
        <>
          {/* Section view: simple circle colored by first solid */}
          <Circle radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
        </>
      )}
    </Group>
  );
}
