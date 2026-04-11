import { Circle, Ellipse, Line, Path, Rect } from 'react-konva';
import { LiaisonNode, type LiaisonComponentProps } from './LiaisonNode';

export function Helicoidale(props: LiaisonComponentProps) {
  const { view = 1, colorA = '#1a1a1a', colorB = '#1a1a1a' } = props;
  const r = 12;
  const h = 22;
  const strokeWidth = 1.5;

  return (
    <LiaisonNode type="helicoidale" {...props}>
      {view === 1 && (
        <>
          {/* Vue 1: rectangle (A) + diagonale */}
          <Rect x={-32} y={-h / 2} width={64} height={h} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
          <Line points={[-32, -h / 2, 32, h / 2]} stroke={colorA} strokeWidth={strokeWidth} />
        </>
      )}
      {view === 2 && (
        <>
          {/* Vue 2: cercle extérieur (A) + demi-cercle intérieur (B) */}
          <Circle radius={r} stroke={colorA} strokeWidth={strokeWidth} fill="white" />
          <Line
            points={Array.from({ length: 17 }, (_, i) => {
              const a = -Math.PI / 2 + (Math.PI * i) / 16;
              return [8 * Math.cos(a), 8 * Math.sin(a)];
            }).flat()}
            stroke={colorB}
            strokeWidth={1.5}
          />
        </>
      )}
      {view === 3 && (
        <>
          {/* Vue 3: cylindre vertical en perspective cavalière + hélice diagonale */}
          <Rect x={-12} y={-22} width={24} height={44} fill="white" />
          <Line points={[-12, -22, -12, 22]} stroke={colorB} strokeWidth={strokeWidth} />
          <Line points={[12, -22, 12, 22]} stroke={colorB} strokeWidth={strokeWidth} />
          <Ellipse x={0} y={-22} radiusX={12} radiusY={7} stroke={colorB} strokeWidth={strokeWidth} fill="white" />
          <Path data="M -12 22 A 12 7 0 0 0 12 22 Z" fill="white" />
          <Path
            data="M -12 22 A 12 7 0 0 0 12 22"
            stroke={colorB}
            strokeWidth={strokeWidth}
            fill={undefined as unknown as string}
          />
          {[-15, -8, -1, 6, 13].map((yArc, i) => (
            <Path
              key={i}
              data={`M -12 ${yArc} A 12 7 0 0 0 12 ${yArc}`}
              stroke={colorA}
              strokeWidth={strokeWidth}
              fill={undefined as unknown as string}
            />
          ))}
        </>
      )}
    </LiaisonNode>
  );
}
