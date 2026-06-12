'use client';

import type { Liaison3DProps } from './shared';
import { CylinderPalier, ROTULE_BALL_R, RotuleSocket, SphereWithSilhouette } from './primitives';

/** Sphérique à doigt — rotule avec un petit cylindre (doigt) sortant radialement. */
export function RotuleDoigt3D({ colorA, colorB }: Liaison3DProps) {
  return (
    <group>
      <RotuleSocket color={colorB} />
      <SphereWithSilhouette radius={ROTULE_BALL_R} color={colorA} />
      <group position={[1.5, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
        <CylinderPalier radius={0.12} halfHeight={0.6} color={colorA} segments={16} />
      </group>
    </group>
  );
}
