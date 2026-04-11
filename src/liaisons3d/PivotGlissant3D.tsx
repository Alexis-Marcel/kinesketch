'use client';


import { LiaisonEdges, type Liaison3DProps } from './shared';

/**
 * Pivot glissant — comme le pivot mais sans tourillons.
 * Palier (B) couché traversé par une barre (A) plus longue.
 */
export function PivotGlissant3D({ colorA, colorB, view }: Liaison3DProps) {
  const alongZ = view === 2;
  const rot: [number, number, number] = alongZ
    ? [Math.PI / 2, 0, 0]
    : [0, 0, Math.PI / 2];

  return (
    <group>
      {/* Palier (B) — contours couleur B */}
      <mesh rotation={rot}>
        <cylinderGeometry args={[1.2, 1.2, 4, 48, 1]} />
        <meshBasicMaterial color="white" />
        <LiaisonEdges color={colorB} />
      </mesh>

      {/* Barre (A) — couleur A pleine */}
      <mesh rotation={rot}>
        <cylinderGeometry args={[0.07, 0.07, 5.2, 12, 1]} />
        <meshBasicMaterial color={colorA} />
      </mesh>
    </group>
  );
}
