'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import type { Line2 } from 'three-stdlib';
import { circleXZ, coneGeneratrices, cylinderGeneratrices, sphereSilhouette } from './silhouette';

export const LINE_WIDTH = 2;

/** White cylinder mesh + 2 rim circles + 2 dynamic silhouette generatrices. */
export function CylinderPalier({
  radius,
  halfHeight,
  color,
  segments = 48,
}: {
  radius: number;
  halfHeight: number;
  color: string;
  segments?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const gen1Ref = useRef<Line2>(null);
  const gen2Ref = useRef<Line2>(null);

  const topRim = useMemo(() => circleXZ(radius, halfHeight), [radius, halfHeight]);
  const botRim = useMemo(() => circleXZ(radius, -halfHeight), [radius, halfHeight]);

  const tmpVec = useMemo(() => new THREE.Vector3(), []);
  useFrame((state) => {
    if (!groupRef.current) return;
    const camLocal = groupRef.current.worldToLocal(tmpVec.copy(state.camera.position));
    const gens = cylinderGeneratrices(radius, halfHeight, camLocal);
    apply2(gen1Ref.current, gens[0]);
    apply2(gen2Ref.current, gens[1]);
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <cylinderGeometry args={[radius, radius, halfHeight * 2, segments, 1]} />
        <meshBasicMaterial color="white" polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <Line points={topRim} color={color} lineWidth={LINE_WIDTH} />
      <Line points={botRim} color={color} lineWidth={LINE_WIDTH} />
      <Line ref={gen1Ref} points={[[0, 0, 0], [0, 0, 0]]} color={color} lineWidth={LINE_WIDTH} />
      <Line ref={gen2Ref} points={[[0, 0, 0], [0, 0, 0]]} color={color} lineWidth={LINE_WIDTH} />
    </group>
  );
}

/** White sphere mesh + dynamic silhouette circle. */
export function SphereWithSilhouette({
  radius,
  color,
  segments = 64,
}: {
  radius: number;
  color: string;
  segments?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const silRef = useRef<Line2>(null);
  const initial = useMemo(() => circleXZ(radius, 0, segments), [radius, segments]);

  const tmpVec = useMemo(() => new THREE.Vector3(), []);
  useFrame((state) => {
    if (!groupRef.current || !silRef.current) return;
    const camLocal = groupRef.current.worldToLocal(tmpVec.copy(state.camera.position));
    const sil = sphereSilhouette(radius, camLocal, segments);
    if (sil.length === 0) { silRef.current.visible = false; return; }
    const positions = new Float32Array(sil.length * 3);
    for (let i = 0; i < sil.length; i++) {
      positions[i * 3] = sil[i].x;
      positions[i * 3 + 1] = sil[i].y;
      positions[i * 3 + 2] = sil[i].z;
    }
    silRef.current.geometry.setPositions(positions);
    silRef.current.computeLineDistances();
    silRef.current.visible = true;
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <sphereGeometry args={[radius, 32, 24]} />
        <meshBasicMaterial color="white" polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <Line ref={silRef} points={initial} color={color} lineWidth={LINE_WIDTH} />
    </group>
  );
}

/**
 * White cone mesh + base rim circle + 2 dynamic silhouette generatrices.
 * Three.js cone convention: apex at +y/2, base at -y/2.
 */
export function ConePalier({
  radius,
  height,
  color,
  segments = 48,
}: {
  radius: number;
  height: number;
  color: string;
  segments?: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const gen1Ref = useRef<Line2>(null);
  const gen2Ref = useRef<Line2>(null);

  const baseRim = useMemo(() => circleXZ(radius, -height / 2), [radius, height]);

  const tmpVec = useMemo(() => new THREE.Vector3(), []);
  useFrame((state) => {
    if (!groupRef.current) return;
    const camLocal = groupRef.current.worldToLocal(tmpVec.copy(state.camera.position));
    const gens = coneGeneratrices(radius, height, camLocal);
    apply2(gen1Ref.current, gens[0]);
    apply2(gen2Ref.current, gens[1]);
  });

  return (
    <group ref={groupRef}>
      <mesh>
        <coneGeometry args={[radius, height, segments, 1]} />
        <meshBasicMaterial color="white" polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <Line points={baseRim} color={color} lineWidth={LINE_WIDTH} />
      <Line ref={gen1Ref} points={[[0, 0, 0], [0, 0, 0]]} color={color} lineWidth={LINE_WIDTH} />
      <Line ref={gen2Ref} points={[[0, 0, 0], [0, 0, 0]]} color={color} lineWidth={LINE_WIDTH} />
    </group>
  );
}

/** White box mesh + 12 edges as one LineSegments2. */
export function EdgedBox({ size, color }: { size: [number, number, number]; color: string }) {
  const [W, H, D] = size;
  const hw = W / 2, hh = H / 2, hd = D / 2;
  const edgePoints = useMemo<[number, number, number][]>(() => {
    const fbl: [number, number, number] = [-hw, -hh, -hd];
    const fbr: [number, number, number] = [+hw, -hh, -hd];
    const ftl: [number, number, number] = [-hw, +hh, -hd];
    const ftr: [number, number, number] = [+hw, +hh, -hd];
    const bbl: [number, number, number] = [-hw, -hh, +hd];
    const bbr: [number, number, number] = [+hw, -hh, +hd];
    const btl: [number, number, number] = [-hw, +hh, +hd];
    const btr: [number, number, number] = [+hw, +hh, +hd];
    return [
      fbl, fbr,  fbr, bbr,  bbr, bbl,  bbl, fbl,
      ftl, ftr,  ftr, btr,  btr, btl,  btl, ftl,
      fbl, ftl,  fbr, ftr,  bbr, btr,  bbl, btl,
    ];
  }, [hw, hh, hd]);

  return (
    <group>
      <mesh>
        <boxGeometry args={[W, H, D]} />
        <meshBasicMaterial color="white" polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <Line points={edgePoints} segments color={color} lineWidth={LINE_WIDTH} />
    </group>
  );
}

/**
 * Open spherical socket — partial sphere (bowl) for Rotule / RotuleDoigt.
 * Mesh is offset by SOCKET_Y; rim circle drawn at the opening.
 */
export const ROTULE_BALL_R = 1.1;
export const ROTULE_SOCKET_R = 1.5;
const SOCKET_THETA_START = Math.PI * 0.4;
const SOCKET_THETA_LENGTH = Math.PI * 0.6;
const SOCKET_Y = -0.3;
const RIM_Y = ROTULE_SOCKET_R * Math.cos(SOCKET_THETA_START) + SOCKET_Y;
const RIM_RADIUS = ROTULE_SOCKET_R * Math.sin(SOCKET_THETA_START);

export function RotuleSocket({ color }: { color: string }) {
  const rim = useMemo(() => circleXZ(RIM_RADIUS, RIM_Y), []);
  return (
    <>
      <mesh position={[0, SOCKET_Y, 0]}>
        <sphereGeometry args={[ROTULE_SOCKET_R, 32, 24, 0, Math.PI * 2, SOCKET_THETA_START, SOCKET_THETA_LENGTH]} />
        <meshBasicMaterial color="white" side={THREE.DoubleSide} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      <Line points={rim} color={color} lineWidth={LINE_WIDTH} />
    </>
  );
}

function apply2(ref: Line2 | null, seg?: [THREE.Vector3, THREE.Vector3]) {
  if (!ref) return;
  if (!seg) { ref.visible = false; return; }
  ref.geometry.setPositions(new Float32Array([
    seg[0].x, seg[0].y, seg[0].z,
    seg[1].x, seg[1].y, seg[1].z,
  ]));
  ref.computeLineDistances();
  ref.visible = true;
}
