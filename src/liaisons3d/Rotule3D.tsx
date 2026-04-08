'use client';

import type { Liaison3DProps } from './shared';

export function Rotule3D({}: Liaison3DProps) {
  return (
    <group>
      <mesh position={[0, -0.3, 0]}>
        <sphereGeometry args={[1.5, 16, 12, 0, Math.PI * 2, Math.PI * 0.4, Math.PI * 0.6]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.1, 16, 16]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
}
