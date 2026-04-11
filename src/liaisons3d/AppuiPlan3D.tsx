'use client';


import { LiaisonEdges, type Liaison3DProps } from './shared';

/**
 * Appui plan — un plan (boîte plate).
 */
export function AppuiPlan3D({ colorA, colorB }: Liaison3DProps) {
  return (
    <group>
      {/* Plan A — face supérieure */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[5, 0.15, 5]} />
        <meshBasicMaterial color="white" />
        <LiaisonEdges color={colorA} />
      </mesh>
      {/* Plan B — face inférieure */}
      <mesh position={[0, -0.1, 0]}>
        <boxGeometry args={[5, 0.15, 5]} />
        <meshBasicMaterial color="white" />
        <LiaisonEdges color={colorB} />
      </mesh>
    </group>
  );
}
