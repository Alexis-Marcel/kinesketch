'use client';

import { Edges } from '@react-three/drei';
import type { Liaison3DProps } from './shared';

/**
 * Sphère-plan (ponctuelle) — une sphère posée sur un plan.
 */
export function Ponctuelle3D({ colorB }: Liaison3DProps) {
  return (
    <group>
      {/* Sphère A */}
      <mesh position={[0, 1.1, 0]}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial color="white" />
      </mesh>
      {/* Plan B */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[5, 0.15, 5]} />
        <meshBasicMaterial color="white" />
        <Edges threshold={15} color={colorB} lineWidth={1.5} />
      </mesh>
    </group>
  );
}
