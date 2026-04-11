'use client';

import { RotuleBall, RotuleSocket, type Liaison3DProps } from './shared';

/**
 * Sphérique à doigt — sphère avec un petit cylindre (doigt) qui sort radialement.
 */
export function RotuleDoigt3D({ colorA }: Liaison3DProps) {
  return (
    <group>
      <RotuleSocket />
      <RotuleBall />
      {/* Doigt — petit cylindre sortant horizontalement */}
      <mesh position={[1.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.12, 0.12, 1.2, 12, 1]} />
        <meshBasicMaterial color={colorA} />
      </mesh>
    </group>
  );
}
