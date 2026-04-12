import type { ReactNode } from 'react';
import type { LiaisonType, LiaisonView } from '../types';

// =============================================================================
// Liaison icons — SVG mirrors of the actual canvas renderers.
//
// Each icon uses the renderer's NATURAL local coordinates (the same numbers
// that appear in src/liaisons/*.tsx) wrapped in a viewBox sized to fit them.
// `vector-effect: non-scaling-stroke` (set globally in App.css) keeps stroke
// widths constant regardless of how the SVG is scaled in the toolbar.
//
// IMPORTANT: when a renderer's geometry changes, update the corresponding
// icon here so the palette stays in sync with the canvas.
// =============================================================================

const icon = (viewBox: string, children: ReactNode) => (
  <svg
    viewBox={viewBox}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="liaison-icon-svg"
    preserveAspectRatio="xMidYMid meet"
  >
    {children}
  </svg>
);

// Simplified vue-3 helper for liaisons that draw a vertical cylinder in
// cavalier perspective (pivot, pivot_glissant, helicoidale).
const verticalCylinder = (extras?: ReactNode) => (
  <>
    <rect x={-12} y={-22} width={24} height={44} fill="white" stroke="none" />
    <line x1={-12} y1={-22} x2={-12} y2={22} />
    <line x1={12} y1={-22} x2={12} y2={22} />
    <ellipse cx={0} cy={-22} rx={12} ry={7} fill="white" />
    <path d="M -12 22 A 12 7 0 0 0 12 22" fill="white" />
    {extras}
  </>
);

// Vue-3 prism for glissiere (pavé droit en perspective propre — face avant
// est un parallélogramme avec une croix dedans, le coin bas-droite étant le
// point le plus bas de toute la figure)
const glissiereVue3 = (() => {
  const halfW = 10, halfH = 24, dx = 10, dy = 5, tilt = 4;
  const axisHalf = 40;
  const p = (sx: number, sy: number, sz: number) => ({
    x: sx * halfW + sz * dx,
    y: sy * halfH + sx * tilt - sz * dy,
  });
  const fbl = p(-1, +1, -1), fbr = p(+1, +1, -1), bbr = p(+1, +1, +1);
  const btr = p(+1, -1, +1), btl = p(-1, -1, +1), ftl = p(-1, -1, -1);
  const yj = p(+1, -1, -1);
  return (
    <>
      <polygon
        points={`${fbr.x},${fbr.y} ${fbl.x},${fbl.y} ${ftl.x},${ftl.y} ${btl.x},${btl.y} ${btr.x},${btr.y} ${bbr.x},${bbr.y}`}
        fill="white"
      />
      <line x1={yj.x} y1={yj.y} x2={ftl.x} y2={ftl.y} />
      <line x1={yj.x} y1={yj.y} x2={btr.x} y2={btr.y} />
      <line x1={ftl.x} y1={ftl.y} x2={btr.x} y2={btr.y} />
      <line x1={0} y1={-axisHalf} x2={0} y2={axisHalf} />
    </>
  );
})();

// 3/4 outer ring used by rotule and rotule_doigt
const rotuleOuterArc = (
  <path d="M 10.6 10.6 A 15 15 0 1 1 10.6 -10.6" />
);

export const LIAISON_ICONS: Record<LiaisonType, Partial<Record<LiaisonView, ReactNode>>> = {
  pivot: {
    1: icon('-46 -16 92 32',
      <>
        <rect x={-32} y={-11} width={64} height={22} fill="white" />
        <line x1={-42} y1={0} x2={42} y2={0} />
        <line x1={-36} y1={-11} x2={-36} y2={11} />
        <line x1={36} y1={-11} x2={36} y2={11} />
      </>
    ),
    2: icon('-14 -14 28 28', <circle r={12} fill="white" />),
    3: icon('-16 -46 32 92',
      <>
        <line x1={0} y1={-42} x2={0} y2={-29} />
        <line x1={-10} y1={-37} x2={10} y2={-33} />
        {verticalCylinder()}
        <line x1={0} y1={-29} x2={0} y2={-22} />
        <line x1={0} y1={29} x2={0} y2={42} />
        <line x1={-10} y1={33} x2={10} y2={37} />
      </>
    ),
  },

  glissiere: {
    1: icon('-46 -16 92 32',
      <>
        <line x1={-42} y1={0} x2={-32} y2={0} />
        <line x1={32} y1={0} x2={42} y2={0} />
        <rect x={-32} y={-11} width={64} height={22} fill="white" />
      </>
    ),
    2: icon('-14 -14 28 28',
      <>
        <rect x={-11} y={-11} width={22} height={22} fill="white" />
        <line x1={-11} y1={-11} x2={11} y2={11} />
        <line x1={11} y1={-11} x2={-11} y2={11} />
      </>
    ),
    3: icon('-24 -44 48 88', glissiereVue3),
  },

  pivot_glissant: {
    1: icon('-46 -16 92 32',
      <>
        <rect x={-32} y={-11} width={64} height={22} fill="white" />
        <line x1={-42} y1={0} x2={42} y2={0} />
      </>
    ),
    2: icon('-14 -14 28 28',
      <>
        <circle r={12} fill="white" />
        <circle r={2.2} fill="currentColor" stroke="none" />
      </>
    ),
    3: icon('-16 -46 32 92',
      <>
        <line x1={0} y1={-42} x2={0} y2={-29} />
        {verticalCylinder()}
        <line x1={0} y1={-29} x2={0} y2={-22} />
        <line x1={0} y1={29} x2={0} y2={42} />
      </>
    ),
  },

  rotule: {
    1: icon('-18 -18 36 36',
      <>
        <circle r={12} fill="white" />
        {rotuleOuterArc}
      </>
    ),
  },

  encastrement: {
    1: icon('-36 -6 72 12', <line x1={-32} y1={0} x2={32} y2={0} />),
  },

  helicoidale: {
    1: icon('-34 -14 68 28',
      <>
        <rect x={-32} y={-11} width={64} height={22} fill="white" />
        <line x1={-32} y1={-11} x2={32} y2={11} />
      </>
    ),
    2: icon('-14 -14 28 28',
      <>
        <circle r={12} fill="white" />
        <path d="M 0 -8 A 8 8 0 0 1 0 8" />
      </>
    ),
    3: icon('-16 -34 32 68',
      verticalCylinder(
        <>
          {[-15, -8, -1, 6, 13].map((y) => (
            <path key={y} d={`M -12 ${y} A 12 7 0 0 0 12 ${y}`} />
          ))}
        </>
      )
    ),
  },

  rotule_doigt: {
    1: icon('-22 -18 40 36',
      <>
        <circle r={12} fill="white" />
        {rotuleOuterArc}
        <line x1={-8.5} y1={8.5} x2={-14.1} y2={14.1} />
      </>
    ),
  },

  appui_plan: {
    1: icon('-34 -8 68 16',
      <>
        <line x1={-32} y1={-3} x2={32} y2={-3} />
        <line x1={-32} y1={3} x2={32} y2={3} />
      </>
    ),
    3: icon('-32 -20 64 40',
      <>
        <polygon points="-28,4 0,18 28,4 0,-10" fill="white" />
        <polygon points="-28,-4 0,10 28,-4 0,-18" fill="white" />
      </>
    ),
  },

  lineaire_annulaire: {
    1: icon('-34 -16 68 32',
      <>
        <rect x={-32} y={-2} width={64} height={16} fill="white" />
        <circle cx={0} cy={-2} r={12} fill="white" />
      </>
    ),
    2: icon('-22 -14 44 32',
      <>
        <circle r={12} fill="white" />
        <path d="M 15 0 A 15 15 0 0 1 -15 0" />
        <line x1={-19} y1={15} x2={19} y2={15} />
      </>
    ),
    3: icon('-32 -24 64 48', (() => {
      const halfLen = 18;
      const erx = 10;
      const ery = 12;
      const tilt = 3;
      const depthRise = 15;
      const fx = -halfLen, fy = depthRise / 2;
      const bx = halfLen, by = -depthRise / 2;
      const silhouette =
        `M ${fx - erx} ${fy - tilt}` +
        ` A ${erx} ${ery} 0 0 0 ${fx + erx} ${fy + tilt}` +
        ` L ${bx + erx} ${by + tilt}` +
        ` A ${erx} ${ery} 0 0 1 ${bx - erx} ${by - tilt}` +
        ` Z`;
      const fbrX = fx + erx * 0.6, fbrY = fy + ery * 0.9;
      const bbrX = bx + erx * 0.6, bbrY = by + ery * 0.9;
      const undersidePath =
        `M ${fx + erx} ${fy + tilt}` +
        ` L ${bx + erx} ${by + tilt}` +
        ` A ${erx} ${ery} 0 0 1 ${bbrX} ${bbrY}` +
        ` L ${fbrX} ${fbrY}` +
        ` A ${erx} ${ery} 0 0 0 ${fx + erx} ${fy + tilt}` +
        ` Z`;
      const sphereCx = (fx + bx) / 2 - 5;
      const sphereCy = (fy + by) / 2 + 2;
      return (
        <>
          <path d={silhouette} fill="white" />
          <circle cx={sphereCx} cy={sphereCy} r={10} fill="white" />
          <path
            d={
              `M ${fx + erx} ${fy + tilt}` +
              ` L ${bx + erx} ${by + tilt}` +
              ` A ${erx} ${ery} 0 0 1 ${bx - erx} ${by - tilt}`
            }
          />
          <path d={undersidePath} fill="white" />
        </>
      );
    })()),
  },

  lineaire_rectiligne: {
    1: icon('-34 -12 68 28',
      <>
        <polygon points="-19,11 -26,-8 26,-8 19,11" fill="white" />
        <line x1={-32} y1={11} x2={32} y2={11} />
      </>
    ),
    2: icon('-22 -14 44 30',
      <>
        <polygon points="-19,-11 0,11 19,-11" fill="white" />
        <line x1={-19} y1={12} x2={19} y2={12} />
      </>
    ),
    3: icon('-32 -22 64 44', (() => {
      const yShift = 5;
      const pL = { x: -28, y: 0 + yShift };
      const pF = { x: 0, y: 14 + yShift };
      const pR = { x: 28, y: 0 + yShift };
      const pB = { x: 0, y: -14 + yShift };
      const mStart = { x: (pL.x + pF.x) / 2, y: (pL.y + pF.y) / 2 };
      const mEnd = { x: (pB.x + pR.x) / 2, y: (pB.y + pR.y) / 2 };
      const w = 6, h = 12;
      const d1x = pF.x - pL.x, d1y = pF.y - pL.y;
      const d1len = Math.sqrt(d1x * d1x + d1y * d1y);
      const ex = (d1x / d1len) * w, ey = (d1y / d1len) * w;
      const tA = { x: mStart.x - ex, y: mStart.y - ey - h };
      const tB = { x: mEnd.x - ex, y: mEnd.y - ey - h };
      const tC = { x: mEnd.x + ex, y: mEnd.y + ey - h };
      const tD = { x: mStart.x + ex, y: mStart.y + ey - h };
      return (
        <>
          <polygon
            points={`${pL.x},${pL.y} ${pF.x},${pF.y} ${pR.x},${pR.y} ${pB.x},${pB.y}`}
            fill="white"
          />
          <polygon
            points={`${tD.x},${tD.y} ${mStart.x},${mStart.y} ${mEnd.x},${mEnd.y} ${tC.x},${tC.y}`}
            fill="white"
            stroke="none"
          />
          <polygon
            points={`${tA.x},${tA.y} ${mStart.x},${mStart.y} ${tD.x},${tD.y}`}
            fill="white"
            stroke="none"
          />
          <polygon
            points={`${tA.x},${tA.y} ${tB.x},${tB.y} ${tC.x},${tC.y} ${tD.x},${tD.y}`}
            fill="white"
          />
          <path
            d={`M ${tC.x} ${tC.y} L ${mEnd.x} ${mEnd.y} L ${mStart.x} ${mStart.y} L ${tA.x} ${tA.y}`}
            fill="none"
          />
          <line x1={tD.x} y1={tD.y} x2={mStart.x} y2={mStart.y} />
        </>
      );
    })()),
  },

  ponctuelle: {
    1: icon('-34 -16 68 32',
      <>
        <circle r={12} fill="white" />
        <line x1={-32} y1={12} x2={32} y2={12} />
      </>
    ),
    3: icon('-32 -22 64 44',
      <>
        <polygon points="-28,5 0,19 28,5 0,-9" fill="white" />
        <circle cx={0} cy={-7} r={12} fill="white" />
      </>
    ),
  },

  bati: {
    1: icon('-26 -8 52 16',
      <>
        <line x1={-22} y1={-4} x2={22} y2={-4} />
        {[-16, -10, -4, 2, 8, 14].map((o) => (
          <line key={o} x1={o} y1={-4} x2={o - 7} y2={4} strokeWidth={1.2} />
        ))}
      </>
    ),
  },

  engrenage_ext: {
    1: icon('-14 -52 28 104',
      <>
        <line x1={0} y1={-48} x2={0} y2={48} />
        <line x1={-7} y1={-48} x2={7} y2={-48} />
        <line x1={-7} y1={-10} x2={7} y2={-10} />
        <line x1={-7} y1={48} x2={7} y2={48} />
      </>
    ),
    2: icon('-40 -100 80 200',
      <>
        <circle cx={0} cy={-58} r={34} fill="white" />
        <circle cx={0} cy={34} r={58} fill="white" />
      </>
    ),
  },

  engrenage_int: {
    1: icon('-30 -52 60 104',
      <>
        <line x1={-12} y1={-48} x2={-12} y2={-10} />
        <line x1={-19} y1={-40} x2={-5} y2={-40} />
        <line x1={-19} y1={-10} x2={-5} y2={-10} />
        <path d="M -12 -40 L -12 -48 L 12 -48 L 12 48 L -12 48 L -12 30" />
        <line x1={-19} y1={30} x2={-5} y2={30} />
      </>
    ),
    2: icon('-66 -66 132 132',
      <>
        <circle r={58} fill="white" />
        <circle cx={0} cy={-34} r={24} fill="white" />
      </>
    ),
  },

  engrenage_conique: {
    1: icon('-52 -52 104 104',
      <>
        <line x1={40} y1={-40} x2={-40} y2={-40} />
        <line x1={-40} y1={-40} x2={-40} y2={40} />
        <line x1={36} y1={-44} x2={44} y2={-36} />
        <line x1={-36} y1={44} x2={-44} y2={36} />
      </>
    ),
    2: icon('-100 -66 200 132',
      <>
        <circle r={58} fill="white" />
        <line x1={-58} y1={-50} x2={-58} y2={50} />
        <line x1={-66} y1={-58} x2={-50} y2={-42} />
        <line x1={-66} y1={58} x2={-50} y2={42} />
      </>
    ),
  },

  roue_vis_sans_fin: {
    1: icon('-26 -90 52 180', (() => {
      const WHEEL_CY = -62, WHEEL_R = 20;
      const ARC_R = 26, ARC_SPAN = 0.5;
      const TOP_ARC_BOTTOM_Y = WHEEL_CY + ARC_R;
      const BOT_ARC_CY = 104;
      const BOT_ARC_TOP_Y = BOT_ARC_CY - ARC_R;
      const dx = ARC_R * Math.sin(ARC_SPAN);
      const dy = ARC_R * Math.cos(ARC_SPAN);
      const topTipY = WHEEL_CY + dy;
      const botTipY = BOT_ARC_CY - dy;
      return (
        <>
          <circle cx={0} cy={WHEEL_CY} r={WHEEL_R} fill="white" />
          <path d={`M ${-dx} ${topTipY} A ${ARC_R} ${ARC_R} 0 0 0 ${dx} ${topTipY}`} />
          <line x1={0} y1={TOP_ARC_BOTTOM_Y} x2={0} y2={BOT_ARC_TOP_Y} />
          <path d={`M ${-dx} ${botTipY} A ${ARC_R} ${ARC_R} 0 0 1 ${dx} ${botTipY}`} />
        </>
      );
    })()),
    2: icon('-66 -84 132 168',
      <>
        <circle cx={0} cy={17} r={58} fill="white" />
        <rect x={-35} y={-75} width={70} height={34} fill="white" />
        <line x1={-5} y1={-63} x2={5} y2={-53} />
        <line x1={-5} y1={-53} x2={5} y2={-63} />
      </>
    ),
  },

  transmission_poulie_courroie: {
    1: icon('-132 -16 264 32',
      <>
        <line x1={-126} y1={-9} x2={-54} y2={-9} />
        <line x1={-126} y1={-9} x2={-126} y2={9} />
        <line x1={-54} y1={-9} x2={-54} y2={9} />
        <line x1={6} y1={-9} x2={126} y2={-9} />
        <line x1={6} y1={-9} x2={6} y2={9} />
        <line x1={126} y1={-9} x2={126} y2={9} />
        <line x1={-126} y1={-3} x2={126} y2={-3} stroke="#22c55e" />
      </>
    ),
    2: icon('-132 -68 264 136',
      <>
        <line x1={-90} y1={-36} x2={66} y2={-60} stroke="#22c55e" />
        <line x1={-90} y1={36} x2={66} y2={60} stroke="#22c55e" />
        <circle cx={-90} cy={0} r={36} fill="white" />
        <circle cx={66} cy={0} r={60} fill="white" />
      </>
    ),
  },

  transmission_pignons_chaine: {
    1: icon('-132 -14 264 28',
      <>
        <line x1={-30} y1={0} x2={6} y2={0} stroke="#22c55e" strokeDasharray="6 4" />
        <line x1={-90} y1={0} x2={-30} y2={0} />
        <line x1={-90} y1={0} x2={-84} y2={-4} />
        <line x1={-90} y1={0} x2={-84} y2={4} />
        <line x1={-30} y1={0} x2={-36} y2={-4} />
        <line x1={-30} y1={0} x2={-36} y2={4} />
        <line x1={6} y1={0} x2={126} y2={0} />
        <line x1={6} y1={0} x2={12} y2={-4} />
        <line x1={6} y1={0} x2={12} y2={4} />
        <line x1={126} y1={0} x2={120} y2={-4} />
        <line x1={126} y1={0} x2={120} y2={4} />
      </>
    ),
    2: icon('-132 -68 264 136',
      <>
        <line x1={-90} y1={-36} x2={66} y2={-60} stroke="#22c55e" strokeDasharray="6 4" />
        <line x1={-90} y1={36} x2={66} y2={60} stroke="#22c55e" strokeDasharray="6 4" />
        <circle cx={-90} cy={0} r={36} fill="white" />
        <circle cx={66} cy={0} r={60} fill="white" />
      </>
    ),
  },
};
