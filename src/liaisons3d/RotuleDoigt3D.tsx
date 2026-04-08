'use client';

import type { Liaison3DProps } from './shared';

/**
 * Sphérique à doigt — sphère avec un petit cylindre (doigt) qui sort radialement.
 */
export function RotuleDoigt3D({ colorA }: Liaison3DProps) {
  return (
    <group>
      {/* Coupelle B */}
      <mesh position={[0, -0.3, 0]}>
        <sphereGeometry args={[1.5, 16, 12, 0, Math.PI * 2, Math.PI * 0.4, Math.PI * 0.6]} />
        <meshBasicMaterial color="white" />
      </mesh>
      {/* Bille A */}
      <mesh>
        <sphereGeometry args={[1.1, 16, 16]} />
        <meshBasicMaterial color="white" />
      </mesh>
      {/* Doigt — petit cylindre sortant horizontalement */}
      <mesh position={[1.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 1.2, 12, 1]} />
        <meshBasicMaterial color={colorA} />
      </mesh>
    </group>
  );
}
