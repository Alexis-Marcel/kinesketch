'use client';


import { LiaisonEdges, type Liaison3DProps } from './shared';

/**
 * Glissière — pavé droit allongé. Face de bout = carré.
 */
export function Glissiere3D({ colorB, view }: Liaison3DProps) {
  const alongZ = view === 2;

  // Section carrée 2x2, longueur 6
  const args: [number, number, number] = alongZ ? [2, 2, 6] : [6, 2, 2];

  return (
    <group>
      <mesh>
        <boxGeometry args={args} />
        <meshBasicMaterial color="white" />
        <LiaisonEdges color={colorB} />
      </mesh>
    </group>
  );
}
