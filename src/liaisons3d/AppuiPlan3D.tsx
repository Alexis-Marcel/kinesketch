'use client';

import type { Liaison3DProps } from './shared';
import { EdgedBox } from './primitives';

/** Appui plan — deux plans (boîtes plates) empilés. */
export function AppuiPlan3D({ colorA, colorB }: Liaison3DProps) {
  return (
    <group>
      <group position={[0, 0.1, 0]}>
        <EdgedBox size={[5, 0.15, 5]} color={colorA} />
      </group>
      <group position={[0, -0.1, 0]}>
        <EdgedBox size={[5, 0.15, 5]} color={colorB} />
      </group>
    </group>
  );
}
