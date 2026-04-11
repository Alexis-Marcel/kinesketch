'use client';


import { LiaisonEdges, type Liaison3DProps } from './shared';

/**
 * Cylindre-plan (linéaire rectiligne) — un cylindre posé sur un plan.
 */
export function LineaireRectiligne3D({ colorA, colorB, view }: Liaison3DProps) {
  const alongZ = view === 2;
  const cylRot: [number, number, number] = alongZ
    ? [Math.PI / 2, 0, 0]
    : [0, 0, Math.PI / 2];

  return (
    <group>
      {/* Cylindre A — posé sur le plan */}
      <mesh position={[0, 1.0, 0]} rotation={cylRot}>
        <cylinderGeometry args={[0.9, 0.9, 4, 48, 1]} />
        <meshBasicMaterial color="white" />
        <LiaisonEdges color={colorA} />
      </mesh>
      {/* Plan B */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[5, 0.15, 5]} />
        <meshBasicMaterial color="white" />
        <LiaisonEdges color={colorB} />
      </mesh>
    </group>
  );
}
