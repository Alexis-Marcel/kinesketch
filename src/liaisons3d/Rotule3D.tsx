'use client';

import type { Liaison3DProps } from './shared';
import { ROTULE_BALL_R, RotuleSocket, SphereWithSilhouette } from './primitives';

/** Rotule (sphérique) — bille pleine cradlée par une coupelle ouverte. */
export function Rotule3D({ colorA, colorB }: Liaison3DProps) {
  return (
    <group>
      <RotuleSocket color={colorB} />
      <SphereWithSilhouette radius={ROTULE_BALL_R} color={colorA} />
    </group>
  );
}
