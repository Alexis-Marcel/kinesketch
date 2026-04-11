import { Line } from 'react-konva';
import { LiaisonNode, type LiaisonComponentProps } from './LiaisonNode';

export function AppuiPlan(props: LiaisonComponentProps) {
  const { view = 1, colorA = '#1a1a1a', colorB = '#1a1a1a' } = props;
  const w = 64;
  const gap = 6;
  const strokeWidth = 1.5;

  return (
    <LiaisonNode type="appui_plan" {...props}>
      {view !== 3 && (
        <>
          {/* Vue 1: deux lignes parallèles horizontales */}
          <Line points={[-w / 2, -gap / 2, w / 2, -gap / 2]} stroke={colorA} strokeWidth={strokeWidth} />
          <Line points={[-w / 2, gap / 2, w / 2, gap / 2]} stroke={colorB} strokeWidth={strokeWidth} />
        </>
      )}
      {view === 3 && (() => {
        // Vue 3: deux losanges en perspective cavalière, légèrement décalés
        const offset = 8;
        const aPts = [-28, -offset / 2 + 0, 0, -offset / 2 + 14, 28, -offset / 2 + 0, 0, -offset / 2 + -14];
        const bPts = [-28, offset / 2 + 0, 0, offset / 2 + 14, 28, offset / 2 + 0, 0, offset / 2 + -14];
        return (
          <>
            <Line points={bPts} closed stroke={colorB} strokeWidth={strokeWidth} fill="white" lineJoin="bevel" />
            <Line points={aPts} closed stroke={colorA} strokeWidth={strokeWidth} fill="white" lineJoin="bevel" />
          </>
        );
      })()}
    </LiaisonNode>
  );
}
