'use client';

import type { Liaison3DProps } from './shared';
import { CylinderPalier } from './primitives';

const R1 = 1.0;
const R2 = 1.5;
const THICKNESS = 0.6;

/** Engrenage extérieur — deux roues dentées (cylindres minces) en contact externe. */
export function EngrenageExt3D({ colorA, colorB }: Liaison3DProps) {
  return (
    <group>
      <group position={[0, R1, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <CylinderPalier radius={R1} halfHeight={THICKNESS / 2} color={colorA} />
      </group>
      <group position={[0, -R2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <CylinderPalier radius={R2} halfHeight={THICKNESS / 2} color={colorB} />
      </group>
    </group>
  );
}
