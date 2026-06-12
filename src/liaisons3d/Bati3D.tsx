'use client';

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { Liaison3DProps } from './shared';
import { LINE_WIDTH } from './primitives';

const HATCH_COUNT = 6;
const HATCH_SPACING = 0.5;
const HATCH_LENGTH = 3;

/** Bâti — sol fixe avec hachures parallèles diagonales (45° dans XZ). */
export function Bati3D({ colorB }: Liaison3DProps) {
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
        [cx - halfL * dirX, 0.11, cz - halfL * dirZ],
        [cx + halfL * dirX, 0.11, cz + halfL * dirZ],
      );
    }
    return pts;
  }, []);

  return (
    <group>
      <mesh>
        <boxGeometry args={[4, 0.2, 4]} />
        <meshBasicMaterial color="white" polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <Line points={hatches} segments color={colorB} lineWidth={LINE_WIDTH} />
    </group>
  );
}
