'use client';

import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Liaison3DProps } from './shared';
import { CylinderPalier, LINE_WIDTH } from './primitives';

const R_INNER = 1.0;
const R_OUTER = 2.2;
const RING_WALL = 0.15;
const THICKNESS = 0.6;

/**
 * Engrenage intérieur — petite roue dentée à l'intérieur d'une couronne creuse.
 * Axe de l'engrenage : Z. Couronne extrudée (annulus) le long de Z.
 */
export function EngrenageInt3D({ colorA, colorB }: Liaison3DProps) {
  const ringShape = useMemo(() => {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, R_OUTER, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, R_OUTER - RING_WALL, 0, Math.PI * 2, true);
    shape.holes.push(hole);
    return shape;
  }, []);

  // 4 cercles de rive : extérieur top/bot et intérieur top/bot, en LineSegments2
  const ringRimSegs = useMemo<[number, number, number][]>(() => {
    const pts: [number, number, number][] = [];
    const segs = 64;
    const circles: { r: number; z: number }[] = [
      { r: R_OUTER, z: THICKNESS / 2 },
      { r: R_OUTER, z: -THICKNESS / 2 },
      { r: R_OUTER - RING_WALL, z: THICKNESS / 2 },
      { r: R_OUTER - RING_WALL, z: -THICKNESS / 2 },
    ];
    for (const c of circles) {
      for (let i = 0; i < segs; i++) {
        const a1 = (i / segs) * Math.PI * 2;
        const a2 = ((i + 1) / segs) * Math.PI * 2;
        pts.push(
          [c.r * Math.cos(a1), c.r * Math.sin(a1), c.z],
          [c.r * Math.cos(a2), c.r * Math.sin(a2), c.z],
        );
      }
    }
    return pts;
  }, []);

  // Inner gear: axis along Z (rotate CylinderPalier whose default axis is Y)
  // Tangent à l'intérieur de la couronne, décalé en Y
  const innerY = R_OUTER - RING_WALL - R_INNER;

  return (
    <group>
      {/* Couronne — extrusion annulaire le long de Z */}
      <mesh position={[0, 0, -THICKNESS / 2]}>
        <extrudeGeometry args={[ringShape, { depth: THICKNESS, bevelEnabled: false, curveSegments: 48 }]} />
        <meshBasicMaterial
          color="white"
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>
      <Line points={ringRimSegs} segments color={colorB} lineWidth={LINE_WIDTH} />

      {/* Petite roue intérieure */}
      <group position={[0, innerY, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <CylinderPalier radius={R_INNER} halfHeight={THICKNESS / 2} color={colorA} />
      </group>
    </group>
  );
}
