'use client';


import { LiaisonEdges, type Liaison3DProps } from './shared';

/**
 * Engrenage conique — deux cônes dont les axes sont perpendiculaires, sommets en contact.
 */
export function EngrenageConique3D({ colorA, colorB }: Liaison3DProps) {
  const r = 1.2;
  const h = 1.5;

  return (
    <group>
      {/* Cône A — axe vertical, pointe vers le bas */}
      <mesh position={[0, h / 2, 0]}>
        <coneGeometry args={[r, h, 32, 1]} />
        <meshBasicMaterial color="white" />
        <LiaisonEdges color={colorA} />
      </mesh>
      {/* Cône B — axe horizontal, pointe vers la gauche */}
      <mesh position={[h / 2, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
        <coneGeometry args={[r, h, 32, 1]} />
        <meshBasicMaterial color="white" />
        <LiaisonEdges color={colorB} />
      </mesh>
    </group>
  );
}
