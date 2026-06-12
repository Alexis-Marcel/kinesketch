import * as THREE from 'three';

/**
 * Two silhouette generatrices of a cylinder centered at origin, axis along Y,
 * radius r, half-height h, given the camera position in the cylinder's local
 * frame. Returns an empty array if the camera is on the axis or inside.
 */
export function cylinderGeneratrices(
  r: number,
  h: number,
  cameraLocal: THREE.Vector3,
): [THREE.Vector3, THREE.Vector3][] {
  const cx = cameraLocal.x;
  const cz = cameraLocal.z;
  const d = Math.hypot(cx, cz);
  if (d <= r + 1e-6) return [];
  const camAngle = Math.atan2(cz, cx);
  const alpha = Math.acos(r / d);
  const t1 = camAngle + alpha;
  const t2 = camAngle - alpha;
  return [
    [
      new THREE.Vector3(r * Math.cos(t1), h, r * Math.sin(t1)),
      new THREE.Vector3(r * Math.cos(t1), -h, r * Math.sin(t1)),
    ],
    [
      new THREE.Vector3(r * Math.cos(t2), h, r * Math.sin(t2)),
      new THREE.Vector3(r * Math.cos(t2), -h, r * Math.sin(t2)),
    ],
  ];
}

/** Polyline of a circle in the XZ plane, at a given Y, radius r. */
export function circleXZ(r: number, y = 0, segments = 64): [number, number, number][] {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push([r * Math.cos(a), y, r * Math.sin(a)]);
  }
  return pts;
}

/**
 * Two silhouette generatrices of a cone in Three.js coneGeometry convention:
 * apex at (0, +h/2, 0), base circle of radius r at y = -h/2. Returns the
 * apex-to-base-tangent segments. Empty array when camera is on the axis or
 * inside the tangent cone (no visible silhouette pair).
 */
export function coneGeneratrices(
  r: number,
  h: number,
  cameraLocal: THREE.Vector3,
): [THREE.Vector3, THREE.Vector3][] {
  const apex = new THREE.Vector3(0, h / 2, 0);
  const D = Math.hypot(cameraLocal.x, cameraLocal.z);
  if (D < 1e-6) return [];
  const k = (r * (h / 2 - cameraLocal.y)) / (D * h);
  if (k <= -1 || k >= 1) return [];
  const camAngle = Math.atan2(cameraLocal.z, cameraLocal.x);
  const dAng = Math.acos(k);
  const t1 = camAngle + dAng;
  const t2 = camAngle - dAng;
  return [
    [apex.clone(), new THREE.Vector3(r * Math.cos(t1), -h / 2, r * Math.sin(t1))],
    [apex.clone(), new THREE.Vector3(r * Math.cos(t2), -h / 2, r * Math.sin(t2))],
  ];
}

/**
 * Silhouette circle of a sphere of radius r centered at origin, seen from a
 * camera at cameraLocal in the sphere's local frame. Uses the perspective
 * tangent cone, so the result is the exact apparent contour. Returns the
 * closed polyline (last point = first).
 */
export function sphereSilhouette(
  r: number,
  cameraLocal: THREE.Vector3,
  segments = 64,
): THREE.Vector3[] {
  const dist = cameraLocal.length();
  if (dist <= r + 1e-6) return [];
  const dir = cameraLocal.clone().divideScalar(dist);
  const offset = (r * r) / dist;
  const silR = r * Math.sqrt(Math.max(0, 1 - (r * r) / (dist * dist)));

  const tmp = Math.abs(dir.y) < 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
  const u = new THREE.Vector3().crossVectors(dir, tmp).normalize();
  const v = new THREE.Vector3().crossVectors(dir, u).normalize();
  const center = dir.clone().multiplyScalar(offset);

  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2;
    pts.push(
      new THREE.Vector3()
        .copy(u).multiplyScalar(silR * Math.cos(a))
        .addScaledVector(v, silR * Math.sin(a))
        .add(center),
    );
  }
  return pts;
}
