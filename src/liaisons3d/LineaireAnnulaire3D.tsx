'use client';

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { Liaison3DProps } from './shared';
import { LINE_WIDTH, SphereWithSilhouette } from './primitives';

const CYL_R = 1.2;
const CYL_HALF_H = 2;
const SPHERE_R = 1.05;
const SEGS = 48;

/**
 * Linéaire annulaire — sphère reposant dans une gouttière (demi-cylindre).
 *   - vue 1/3 : axe -X, ouverture vers +Z (face caméra)
 *   - vue 2   : axe -Z, ouverture vers +Y (vers le haut)
 *
 * Mesh fermé (end caps half-disc) → les contours suivent les arêtes réelles.
 */
export function LineaireAnnulaire3D({ colorA, colorB, view }: Liaison3DProps) {
  const rot: [number, number, number] =
    view === 2 ? [-Math.PI / 2, 0, 0]
    : [0, 0, Math.PI / 2];

  // End cap outline — semicircle (theta π→2π in XZ) closed by its diameter
  const endCapOutline = useMemo<[number, number, number][]>(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i <= SEGS; i++) {
      const a = Math.PI + (i / SEGS) * Math.PI;
      pts.push([CYL_R * Math.cos(a), 0, CYL_R * Math.sin(a)]);
    }
    pts.push([-CYL_R, 0, 0]); // close via diameter
    return pts;
  }, []);

  const topCap = useMemo(
    () => endCapOutline.map(([x, , z]) => [x, CYL_HALF_H, z] as [number, number, number]),
    [endCapOutline],
  );
  const botCap = useMemo(
    () => endCapOutline.map(([x, , z]) => [x, -CYL_HALF_H, z] as [number, number, number]),
    [endCapOutline],
  );

  return (
    <group>
      <group rotation={rot}>
        {/* Demi-coque cylindrique blanche, fermée par les caps half-disc */}
        <mesh>
          <cylinderGeometry args={[CYL_R, CYL_R, CYL_HALF_H * 2, SEGS, 1, false, Math.PI, Math.PI]} />
          <meshBasicMaterial
            color="white"
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
        {/* End caps (demi-cercle + diamètre) — bordure des half-discs aux deux bouts */}
        <Line points={topCap} color={colorB} lineWidth={LINE_WIDTH} />
        <Line points={botCap} color={colorB} lineWidth={LINE_WIDTH} />
        {/* Lèvres axiales — bords de l'ouverture (à x=±r, z=0) */}
        <Line points={[[CYL_R, -CYL_HALF_H, 0], [CYL_R, CYL_HALF_H, 0]]} color={colorB} lineWidth={LINE_WIDTH} />
        <Line points={[[-CYL_R, -CYL_HALF_H, 0], [-CYL_R, CYL_HALF_H, 0]]} color={colorB} lineWidth={LINE_WIDTH} />
      </group>

      {/* Sphère reposant dans la gouttière, centrée sur l'axe */}
      <SphereWithSilhouette radius={SPHERE_R} color={colorA} />
    </group>
  );
}
