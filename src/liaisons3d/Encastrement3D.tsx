'use client';

import type { Liaison3DProps } from './shared';

export function Encastrement3D({ colorB }: Liaison3DProps) {
  return (
    <group>
      <mesh>
        <boxGeometry args={[3, 2, 3]} />
        <meshBasicMaterial color="white" />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const offset = -1 + i * 0.5;
        return (
          <mesh key={i} position={[offset, 1.01, offset]} rotation={[0, Math.PI / 4, 0]}>
            <boxGeometry args={[0.04, 0.01, 2.5]} />
            <meshBasicMaterial color={colorB} />
          </mesh>
        );
      })}
    </group>
  );
}
