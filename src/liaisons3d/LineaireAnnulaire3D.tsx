'use client';

import { Edges } from '@react-three/drei';
import type { Liaison3DProps } from './shared';

/**
 * Sphère-cylindre (linéaire annulaire) — sphère à l'intérieur d'un cylindre.
 */
export function LineaireAnnulaire3D({ colorB, view }: Liaison3DProps) {
  const alongZ = view === 2;
  const rot: [number, number, number] = alongZ
    ? [Math.PI / 2, 0, 0]
    : [0, 0, Math.PI / 2];

  return (
    <group>
      {/* Cylindre B — palier */}
      <mesh rotation={rot}>
        <cylinderGeometry args={[1.2, 1.2, 4, 48, 1]} />
        <meshBasicMaterial color="white" />
        <Edges threshold={15} color={colorB} lineWidth={1.5} />
      </mesh>
      {/* Sphère A — à l'intérieur du cylindre */}
      <mesh>
        <sphereGeometry args={[1.05, 24, 16]} />
        <meshBasicMaterial color="white" />
      </mesh>
    </group>
  );
}
