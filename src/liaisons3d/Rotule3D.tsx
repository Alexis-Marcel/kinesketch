'use client';

import { RotuleBall, RotuleSocket } from './shared';

export function Rotule3D() {
  return (
    <group>
      <RotuleSocket />
      <RotuleBall />
    </group>
  );
}
