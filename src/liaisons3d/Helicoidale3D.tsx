'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Line2 } from 'three-stdlib';
import type { Liaison3DProps } from './shared';
import { circleXZ, cylinderGeneratrices } from './silhouette';

const PALIER_R = 1.2;
const PALIER_H = 0.75;          // half-height — écrou court (matches old design)
const HELIX_R = 0.5;
const HELIX_TURNS = 3;
const HELIX_HEIGHT = 4;
const HELIX_SEGS_PER_TURN = 32;
const LINE_WIDTH = 2;

/**
 * Hélicoïdale — écrou (palier B) traversé par une vis dont le filetage est
 * représenté par une vraie hélice 3D (A). L'hélice est occultée par le mesh
 * blanc de l'écrou aux portions à l'intérieur, ne laissant visibles que les
 * boucles dépassant en haut et en bas.
 */
export function Helicoidale3D({ colorA, colorB, view }: Liaison3DProps) {
  const rot: [number, number, number] =
    view === 2 ? [Math.PI / 2, 0, 0] :
    view === 3 ? [0, 0, 0] :
    [0, 0, Math.PI / 2];

  const palierRef = useRef<THREE.Group>(null);
  const gen1Ref = useRef<Line2>(null);
  const gen2Ref = useRef<Line2>(null);

  const topRim = useMemo(() => circleXZ(PALIER_R, PALIER_H), []);
  const botRim = useMemo(() => circleXZ(PALIER_R, -PALIER_H), []);

  // Hélice 3D — paramètre t ∈ [0, 1] le long de la hauteur, angle = t·turns·2π
  const helixPoints = useMemo(() => {
    const pts: [number, number, number][] = [];
    const total = HELIX_TURNS * HELIX_SEGS_PER_TURN;
    for (let i = 0; i <= total; i++) {
      const t = i / total;
      const angle = t * HELIX_TURNS * Math.PI * 2;
      pts.push([
        Math.cos(angle) * HELIX_R,
        -HELIX_HEIGHT / 2 + t * HELIX_HEIGHT,
        Math.sin(angle) * HELIX_R,
      ]);
    }
    return pts;
  }, []);

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
        {/* Écrou (palier) — mesh blanc opaque, repoussé au z-buffer */}
        <mesh>
          <cylinderGeometry args={[PALIER_R, PALIER_R, PALIER_H * 2, 48, 1]} />
          <meshBasicMaterial
            color="white"
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        </mesh>
        {/* Cercles de rive (B) */}
        <Line points={topRim} color={colorB} lineWidth={LINE_WIDTH} />
        <Line points={botRim} color={colorB} lineWidth={LINE_WIDTH} />
        {/* Génératrices silhouette (B) — recalculées par frame */}
        <Line ref={gen1Ref} points={[[0, 0, 0], [0, 0, 0]]} color={colorB} lineWidth={LINE_WIDTH} />
        <Line ref={gen2Ref} points={[[0, 0, 0], [0, 0, 0]]} color={colorB} lineWidth={LINE_WIDTH} />
      </group>

      {/* Hélice 3D (A) — depth-test occulte naturellement les boucles à l'intérieur */}
      <Line points={helixPoints} color={colorA} lineWidth={LINE_WIDTH} />
    </group>
  );
}
