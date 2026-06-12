'use client';

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { Liaison3DProps } from './shared';
import { EdgedBox, LINE_WIDTH } from './primitives';

const HATCH_COUNT = 5;
const HATCH_SPACING = 0.45;
const HATCH_LENGTH = 2.5;

/** Encastrement — bloc fixe (boîte) avec hachures sur le dessus. */
export function Encastrement3D({ colorA, colorB }: Liaison3DProps) {
  const hatches = useMemo<[number, number, number][]>(() => {
    const dirX = Math.SQRT1_2;
    const dirZ = Math.SQRT1_2;
    const perpX = Math.SQRT1_2;
    const perpZ = -Math.SQRT1_2;
    const halfL = HATCH_LENGTH / 2;
    const pts: [number, number, number][] = [];
    for (let i = 0; i < HATCH_COUNT; i++) {
      const o = -((HATCH_COUNT - 1) * HATCH_SPACING) / 2 + i * HATCH_SPACING;
      const cx = perpX * o, cz = perpZ * o;
      pts.push(
        [cx - halfL * dirX, 1.01, cz - halfL * dirZ],
        [cx + halfL * dirX, 1.01, cz + halfL * dirZ],
      );
    }
    return pts;
  }, []);

  return (
    <group>
      <EdgedBox size={[3, 2, 3]} color={colorA} />
      <Line points={hatches} segments color={colorB} lineWidth={LINE_WIDTH} />
    </group>
  );
}
