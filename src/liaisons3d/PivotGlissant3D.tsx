'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Line2 } from 'three-stdlib';
import type { Liaison3DProps } from './shared';
import { circleXZ, cylinderGeneratrices } from './silhouette';

const PALIER_R = 1.2;
const PALIER_H = 2;       // half-height
const AXIS_HALF = 3.8;    // même axe que Pivot3D ; la différence est la présence des picots côté Pivot
const LINE_WIDTH = 2;

/**
 * Pivot glissant — palier cylindrique traversé par un axe long, sans
 * tourillons (la pièce peut coulisser librement le long de l'axe).
 */
export function PivotGlissant3D({ colorA, colorB, view }: Liaison3DProps) {
  const rot: [number, number, number] =
    view === 2 ? [Math.PI / 2, 0, 0] :
    view === 3 ? [0, 0, 0] :
    [0, 0, Math.PI / 2];

  const palierRef = useRef<THREE.Group>(null);
  const gen1Ref = useRef<Line2>(null);
  const gen2Ref = useRef<Line2>(null);

  const topRim = useMemo(() => circleXZ(PALIER_R, PALIER_H), []);
  const botRim = useMemo(() => circleXZ(PALIER_R, -PALIER_H), []);

  const tmpVec = useMemo(() => new THREE.Vector3(), []);
  useFrame((state) => {
    if (!palierRef.current) return;
    const camLocal = palierRef.current.worldToLocal(tmpVec.copy(state.camera.position));
    const gens = cylinderGeneratrices(PALIER_R, PALIER_H, camLocal);
    const apply = (ref: Line2 | null, seg?: [THREE.Vector3, THREE.Vector3]) => {
      if (!ref) return;
      if (!seg) { ref.visible = false; return; }
      ref.geometry.setPositions(new Float32Array([
        seg[0].x, seg[0].y, seg[0].z,
        seg[1].x, seg[1].y, seg[1].z,
      ]));
      ref.computeLineDistances();
      ref.visible = true;
    };
    apply(gen1Ref.current, gens[0]);
    apply(gen2Ref.current, gens[1]);
  });

  return (
    <group rotation={rot}>
      <group ref={palierRef}>
        {/* Palier — mesh blanc opaque, repoussé au z-buffer */}
        <mesh>
          <cylinderGeometry args={[PALIER_R, PALIER_R, PALIER_H * 2, 48, 1]} />
          <meshBasicMaterial
            color="white"
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
        {/* Cercles de rive (statiques) */}
        <Line points={topRim} color={colorB} lineWidth={LINE_WIDTH} />
        <Line points={botRim} color={colorB} lineWidth={LINE_WIDTH} />
        {/* Génératrices silhouette — recalculées par frame */}
        <Line ref={gen1Ref} points={[[0, 0, 0], [0, 0, 0]]} color={colorB} lineWidth={LINE_WIDTH} />
        <Line ref={gen2Ref} points={[[0, 0, 0], [0, 0, 0]]} color={colorB} lineWidth={LINE_WIDTH} />
        {/* Axe long traversant — occulté à l'intérieur, stubs longs aux extrémités */}
        <Line
          points={[[0, -AXIS_HALF, 0], [0, AXIS_HALF, 0]]}
          color={colorA}
          lineWidth={LINE_WIDTH}
        />
      </group>
    </group>
  );
}
