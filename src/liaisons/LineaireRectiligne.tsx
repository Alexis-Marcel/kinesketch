import { Group, Line, Rect } from 'react-konva';
import { snap } from '../utils/snap';

interface LineaireRectiligneProps {
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

export function LineaireRectiligne({ x, y, rotation, scale = 1, view = 1,  colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: LineaireRectiligneProps) {
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
          {/* Plan view: open trapezoid as polyline (A) + horizontal line (B) */}
          <Line points={[-7, 11, -22, -11, 22, -11, 7, 11]} stroke={colorA} strokeWidth={strokeWidth} lineJoin="miter" />
          <Line points={[-22, 11, 22, 11]} stroke={colorB} strokeWidth={strokeWidth} />
        </>
      ) : (
        <>
          {/* Section view: closed triangle (A) + horizontal line bottom (B) */}
          <Line points={[-19, -11, 0, 11, 19, -11]} stroke={colorA} strokeWidth={strokeWidth} lineJoin="miter" closed />
          <Line points={[-19, 12, 19, 12]} stroke={colorB} strokeWidth={strokeWidth} />
        </>
      )}
    </Group>
  );
}
