'use client';

import type { Liaison3DProps } from './shared';

/**
 * Bâti — sol fixe avec hachures (référentiel).
 */
export function Bati3D({ colorB }: Liaison3DProps) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[4, 0.2, 4]} />
        <meshBasicMaterial color="white" />
      </mesh>
      {/* Hachures sur le dessus */}
      {Array.from({ length: 6 }, (_, i) => {
        const offset = -1.5 + i * 0.6;
        return (
          <mesh key={i} position={[offset, 0.11, offset]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[0.04, 0.01, 3]} />
            <meshBasicMaterial color={colorB} />
          </mesh>
        );
      })}
    </group>
  );
}
