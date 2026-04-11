'use client';

import { Edges } from '@react-three/drei';
import type { LiaisonView } from '../types';

/** Shared props for all 3D liaison components. */
export interface Liaison3DProps {
  colorA: string;
  colorB: string;
  view: LiaisonView;
}

/** Standard edge styling used across every liaison mesh. */
export const EDGE_THRESHOLD = 15;
export const EDGE_LINE_WIDTH = 1.5;

/** Shorthand wrapper around <Edges> with the project-wide defaults. */
export function LiaisonEdges({ color }: { color: string }) {
  return <Edges threshold={EDGE_THRESHOLD} color={color} lineWidth={EDGE_LINE_WIDTH} />;
}

/** Open spherical socket (used by Rotule and RotuleDoigt). */
export function RotuleSocket() {
  return (
    <mesh position={[0, -0.3, 0]}>
      <sphereGeometry args={[1.5, 16, 12, 0, Math.PI * 2, Math.PI * 0.4, Math.PI * 0.6]} />
      <meshBasicMaterial color="white" />
    </mesh>
  );
}

/** Inner ball (used by Rotule and RotuleDoigt). */
export function RotuleBall() {
  return (
    <mesh>
      <sphereGeometry args={[1.1, 16, 16]} />
      <meshBasicMaterial color="white" />
    </mesh>
  );
}
