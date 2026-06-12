'use client';

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Liaison3DProps } from './shared';
import { EdgedBox, LINE_WIDTH } from './primitives';

const PRISM_AXIS_L = 4;
const PRISM_H = 0.9;        // apex-to-base height
const PRISM_W = 1.4;        // base width
const PLANE_TOP = 0.075;    // top of the EdgedBox (size [5, 0.15, 5] centered at y=0)

/**
 * Linéaire rectiligne — prisme triangulaire posé sur un plan, apex vers le bas.
 * La ligne d'apex (axiale) repose sur le plan et fournit le contact linéaire.
 */
export function LineaireRectiligne3D({ colorA, colorB, view }: Liaison3DProps) {
  // ExtrudeGeometry extrudes shape (in XY) along +Z. Default prism axis = Z.
  // For view 2 (axis = world Z) keep identity. For view 1/3, rotate Y by π/2
  // so local Z becomes world X.
  const prismRot: [number, number, number] = view === 2 ? [0, 0, 0] : [0, Math.PI / 2, 0];

  const triShape = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);                       // apex
    s.lineTo(PRISM_W / 2, PRISM_H);       // top-right
    s.lineTo(-PRISM_W / 2, PRISM_H);      // top-left
    s.closePath();
    return s;
  }, []);

  // 9 edges of the prism in centered-at-origin local frame (axis = Z, apex at y=0)
  const prismEdges = useMemo<[number, number, number][]>(() => {
    const halfL = PRISM_AXIS_L / 2;
    const Aa: [number, number, number] = [0, 0, -halfL];
    const Ab: [number, number, number] = [0, 0, halfL];
    const Ba: [number, number, number] = [PRISM_W / 2, PRISM_H, -halfL];
    const Bb: [number, number, number] = [PRISM_W / 2, PRISM_H, halfL];
    const Ca: [number, number, number] = [-PRISM_W / 2, PRISM_H, -halfL];
    const Cb: [number, number, number] = [-PRISM_W / 2, PRISM_H, halfL];
    return [
      Aa, Ab,  Ba, Bb,  Ca, Cb,             // 3 axial edges
      Aa, Ba,  Ba, Ca,  Ca, Aa,             // front triangle
      Ab, Bb,  Bb, Cb,  Cb, Ab,             // back triangle
    ];
  }, []);

  return (
    <group>
      <EdgedBox size={[5, 0.15, 5]} color={colorB} />
      <group position={[0, PLANE_TOP, 0]} rotation={prismRot}>
        {/* Mesh décalé pour centrer le prisme sur z=0 dans ce groupe */}
        <mesh position={[0, 0, -PRISM_AXIS_L / 2]}>
          <extrudeGeometry args={[triShape, { depth: PRISM_AXIS_L, bevelEnabled: false }]} />
          <meshBasicMaterial color="white" polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
        <Line points={prismEdges} segments color={colorA} lineWidth={LINE_WIDTH} />
      </group>
    </group>
  );
}
