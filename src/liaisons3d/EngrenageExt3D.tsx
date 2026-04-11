'use client';


import { LiaisonEdges, type Liaison3DProps } from './shared';

/**
 * Engrenage extérieur — deux roues dentées (cylindres) en contact extérieur.
 */
export function EngrenageExt3D({ colorA, colorB }: Liaison3DProps) {
  const r1 = 1.0;
  const r2 = 1.5;
  const thickness = 0.6;

  return (
    <group>
      {/* Roue A */}
      <mesh position={[0, r1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r1, r1, thickness, 24, 1]} />
        <meshBasicMaterial color="white" />
        <LiaisonEdges color={colorA} />
      </mesh>
      {/* Roue B */}
      <mesh position={[0, -r2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[r2, r2, thickness, 24, 1]} />
        <meshBasicMaterial color="white" />
        <LiaisonEdges color={colorB} />
      </mesh>
    </group>
  );
}
