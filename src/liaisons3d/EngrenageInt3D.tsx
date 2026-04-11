'use client';


import { LiaisonEdges, type Liaison3DProps } from './shared';

/**
 * Engrenage intérieur — petite roue dentée à l'intérieur d'une grande couronne.
 */
export function EngrenageInt3D({ colorA, colorB }: Liaison3DProps) {
  const rInner = 1.0;
  const rOuter = 2.2;
  const thickness = 0.6;

  return (
    <group>
      {/* Petite roue A — en haut, tangente intérieurement à la couronne */}
      <mesh position={[0, rOuter - rInner, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[rInner, rInner, thickness, 24, 1]} />
        <meshBasicMaterial color="white" />
        <LiaisonEdges color={colorA} />
      </mesh>
      {/* Couronne B — anneau */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[rOuter - 0.15, rOuter, 48]} />
        <meshBasicMaterial color={colorB} side={2} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, thickness / 2]}>
        <ringGeometry args={[rOuter - 0.15, rOuter, 48]} />
        <meshBasicMaterial color={colorB} side={2} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -thickness / 2]}>
        <ringGeometry args={[rOuter - 0.15, rOuter, 48]} />
        <meshBasicMaterial color={colorB} side={2} />
      </mesh>
    </group>
  );
}
