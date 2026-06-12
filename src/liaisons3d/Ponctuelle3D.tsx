'use client';

import type { Liaison3DProps } from './shared';
import { EdgedBox, SphereWithSilhouette } from './primitives';

/** Ponctuelle — une sphère posée sur un plan. */
export function Ponctuelle3D({ colorA, colorB }: Liaison3DProps) {
  return (
    <group>
      <group position={[0, 1.1, 0]}>
        <SphereWithSilhouette radius={1} color={colorA} />
      </group>
      <EdgedBox size={[5, 0.15, 5]} color={colorB} />
    </group>
  );
}
