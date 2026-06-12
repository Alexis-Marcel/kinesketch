'use client';

import type { Liaison3DProps } from './shared';
import { ConePalier } from './primitives';

const R = 1.2;
const H = 1.5;

/**
 * Engrenage conique — deux cônes dont les axes sont perpendiculaires, bases
 * coïncidentes à l'origine, apex pointant vers +Y et +X.
 */
export function EngrenageConique3D({ colorA, colorB }: Liaison3DProps) {
  return (
    <group>
      <group position={[0, H / 2, 0]}>
        <ConePalier radius={R} height={H} color={colorA} />
      </group>
      <group position={[H / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <ConePalier radius={R} height={H} color={colorB} />
      </group>
    </group>
  );
}
