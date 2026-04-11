'use client';


import { LiaisonEdges, type Liaison3DProps } from './shared';

export function Pivot3D({ colorA, colorB, view }: Liaison3DProps) {
  // Vue 1: axis along X (cylinder lying on X)
  // Vue 2: axis along Z (cylinder pointing toward camera)
  // Vue 3: axis along Y (cylinder standing vertically)
  const rot: [number, number, number] =
    view === 2 ? [Math.PI / 2, 0, 0] :
    view === 3 ? [0, 0, 0] :
    [0, 0, Math.PI / 2];

  const endOffset = 2.6;
  const endPos1: [number, number, number] =
    view === 2 ? [0, 0, endOffset] :
    view === 3 ? [0, endOffset, 0] :
    [endOffset, 0, 0];
  const endPos2: [number, number, number] =
    view === 2 ? [0, 0, -endOffset] :
    view === 3 ? [0, -endOffset, 0] :
    [-endOffset, 0, 0];

  return (
    <group>
      {/* Palier (B) */}
      {/* Palier (B) — contours couleur B */}
      <mesh rotation={rot}>
        <cylinderGeometry args={[1.2, 1.2, 4, 48, 1]} />
        <meshBasicMaterial color="white" />
        <LiaisonEdges color={colorB} />
      </mesh>

      {/* Barre (A) — couleur A pleine */}
      <mesh rotation={rot}>
        <cylinderGeometry args={[0.07, 0.07, 5.2, 12, 1]} />
        <meshBasicMaterial color={colorA} />
      </mesh>

      {/* Tourillon 1 — rempli couleur A, pas de contour */}
      <mesh position={endPos1}>
        <cylinderGeometry args={[0.08, 0.08, 2.4, 12, 1]} />
        <meshBasicMaterial color={colorA} />
      </mesh>

      {/* Tourillon 2 — rempli couleur A, pas de contour */}
      <mesh position={endPos2}>
        <cylinderGeometry args={[0.08, 0.08, 2.4, 12, 1]} />
        <meshBasicMaterial color={colorA} />
      </mesh>
    </group>
  );
}
