import { Circle, Group, Line, Rect } from 'react-konva';
import { snap } from '../utils/snap';

interface LineaireAnnulaireProps {
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

export function LineaireAnnulaire({ x, y, rotation, view = 1, selected, colorA = '#1a1a1a', colorB = '#1a1a1a', onSelect, onDragMove, onDragEnd, onDblClick }: LineaireAnnulaireProps) {
  const r = 12;
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
      {view === 1 ? (
        <>
          {/* Plan view: rectangle (B) + circle centered on top edge (A) */}
          <Rect x={-22} y={-6} width={44} height={16} stroke={colorB} strokeWidth={strokeWidth} fill="white" />
          <Circle x={0} y={-6} radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
        </>
      ) : (
        <>
          {/* Section view: circle (A) + bottom semicircle (B) + bottom line (B) */}
          <Circle radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
          <Line
            points={Array.from({ length: 17 }, (_, i) => {
              const a = (Math.PI * i) / 16;
              return [15 * Math.cos(a), 15 * Math.sin(a)];
            }).flat()}
            stroke={colorB}
            strokeWidth={strokeWidth}
          />
          <Line points={[-19, 15, 19, 15]} stroke={colorB} strokeWidth={strokeWidth} />
        </>
      )}
    </Group>
  );
}
