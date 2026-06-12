'use client';

import { Line } from '@react-three/drei';
import type { Liaison3DProps } from './shared';

const HALF_W = 3;            // long half-length (along X canonical)
const HALF_H = 1;             // section half-height (along Y)
const HALF_D = 1;             // section half-depth (along Z)
const AXIS_OVERSHOOT = 1;     // axis extends past the box on each end
const LINE_WIDTH = 2;

/**
 * Glissière — pavé droit allongé. Section carrée 2×2, longueur 6 (canonique
 * le long de X). View 2 oriente la pièce le long de Z par une rotation Y.
 */
export function Glissiere3D({ colorA, colorB, view }: Liaison3DProps) {
  const rot: [number, number, number] = view === 2 ? [0, Math.PI / 2, 0] : [0, 0, 0];

  // 8 corners
  const fbl: [number, number, number] = [-HALF_W, -HALF_H, -HALF_D];
  const fbr: [number, number, number] = [+HALF_W, -HALF_H, -HALF_D];
  const ftl: [number, number, number] = [-HALF_W, +HALF_H, -HALF_D];
  const ftr: [number, number, number] = [+HALF_W, +HALF_H, -HALF_D];
  const bbl: [number, number, number] = [-HALF_W, -HALF_H, +HALF_D];
  const bbr: [number, number, number] = [+HALF_W, -HALF_H, +HALF_D];
  const btl: [number, number, number] = [-HALF_W, +HALF_H, +HALF_D];
  const btr: [number, number, number] = [+HALF_W, +HALF_H, +HALF_D];

  // 12 edges, packed as segment pairs for LineSegments2
  const edgePoints: [number, number, number][] = [
    fbl, fbr,  fbr, bbr,  bbr, bbl,  bbl, fbl,    // bottom face
    ftl, ftr,  ftr, btr,  btr, btl,  btl, ftl,    // top face
    fbl, ftl,  fbr, ftr,  bbr, btr,  bbl, btl,    // vertical connectors
  ];

  const axisHalf = HALF_W + AXIS_OVERSHOOT;

  return (
    <group rotation={rot}>
      {/* Pavé blanc opaque, repoussé au z-buffer pour pas de z-fighting */}
      <mesh>
        <boxGeometry args={[HALF_W * 2, HALF_H * 2, HALF_D * 2]} />
        <meshBasicMaterial
          color="white"
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      {/* 12 arêtes du pavé (colorA), en LineSegments2 — épaisseur constante */}
      <Line
        points={edgePoints}
        segments
        color={colorA}
        lineWidth={LINE_WIDTH}
      />
      {/* Axe (colorB) — traverse le pavé, occulté à l'intérieur par le mesh
          blanc, ne laissant visibles que les stubs aux deux extrémités */}
      <Line
        points={[[-axisHalf, 0, 0], [axisHalf, 0, 0]]}
        color={colorB}
        lineWidth={LINE_WIDTH}
      />
    </group>
  );
}
