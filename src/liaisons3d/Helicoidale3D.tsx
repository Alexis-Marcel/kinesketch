'use client';

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import type { Liaison3DProps } from './shared';

export function Helicoidale3D({ colorA, view }: Liaison3DProps) {
  const alongZ = view === 2;
  const rot: [number, number, number] = alongZ
    ? [Math.PI / 2, 0, 0]
    : [0, 0, Math.PI / 2];

  const helixPoints = useMemo(() => {
    const points: [number, number, number][] = [];
    const turns = 3;
    const height = 4;
    const radius = 0.5;
    for (let i = 0; i <= turns * 32; i++) {
      const t = i / (turns * 32);
      const angle = t * turns * Math.PI * 2;
      if (alongZ) {
        points.push([Math.cos(angle) * radius, Math.sin(angle) * radius, -height / 2 + t * height]);
      } else {
        points.push([-height / 2 + t * height, Math.cos(angle) * radius, Math.sin(angle) * radius]);
      }
    }
    return points;
  }, [alongZ]);

  return (
    <group>
      <mesh rotation={rot}>
        <cylinderGeometry args={[1.2, 1.2, 1.5, 6]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh rotation={rot}>
        <cylinderGeometry args={[0.07, 0.07, 5, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <Line points={helixPoints} color={colorA} lineWidth={1.5} />
    </group>
  );
}
