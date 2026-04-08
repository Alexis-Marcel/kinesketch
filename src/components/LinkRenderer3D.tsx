'use client';

import { useMemo } from 'react';
import { Html } from '@react-three/drei';
import { type ThreeEvent } from '@react-three/fiber';
import * as THREE from 'three';
import type { DiagramNode, Link } from '../types';
import { getBestAnchor3D } from '../utils/anchors3d';

interface LinkRenderer3DProps {
  link: Link;
  fromNode: DiagramNode;
  toNode: DiagramNode;
  color: string;
  selected: boolean;
  fromSolideMapping: { a: string | null; b: string | null };
  toSolideMapping: { a: string | null; b: string | null };
  onClick?: (e: ThreeEvent<MouseEvent>) => void;
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
}

export function LinkRenderer3D({ link, fromNode, toNode, color, selected, fromSolideMapping, toSolideMapping, onClick, onPointerDown }: LinkRenderer3DProps) {
  const points = useMemo(() => {
    // Resolve anchors
    const toTarget = { x: toNode.x, y: toNode.y, z: toNode.z };
    const fromTarget = { x: fromNode.x, y: fromNode.y, z: fromNode.z };

    const fromAnchor = getBestAnchor3D(fromNode, toTarget, link.solideId, fromSolideMapping, link.fromAnchorIdx);
    const toAnchor = getBestAnchor3D(toNode, fromTarget, link.solideId, toSolideMapping, link.toAnchorIdx);

    // Refine: use resolved positions for second pass
    const fromFinal = getBestAnchor3D(fromNode, toAnchor, link.solideId, fromSolideMapping, link.fromAnchorIdx);
    const toFinal = getBestAnchor3D(toNode, fromAnchor, link.solideId, toSolideMapping, link.toAnchorIdx);

    const pts: THREE.Vector3[] = [
      new THREE.Vector3(fromFinal.x, fromFinal.y, fromFinal.z),
    ];

    if (link.midpoints) {
      for (const mp of link.midpoints) {
        pts.push(new THREE.Vector3(mp.x, mp.y ?? 0, mp.z ?? 0));
      }
    }

    pts.push(new THREE.Vector3(toFinal.x, toFinal.y, toFinal.z));

    return pts;
  }, [fromNode, toNode, link, fromSolideMapping, toSolideMapping]);

  const labelPos = useMemo(() => {
    const mid = Math.floor(points.length / 2);
    const p = points.length % 2 === 0
      ? new THREE.Vector3().lerpVectors(points[mid - 1], points[mid], 0.5)
      : points[mid];
    return p;
  }, [points]);

  return (
    <group>
      {points.length >= 2 && (
        <mesh
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(e);
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
            onPointerDown?.(e);
          }}
        >
          <tubeGeometry args={[
            new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0),
            points.length * 8,
            selected ? 0.12 : 0.07,
            8,
            false,
          ]} />
          <meshBasicMaterial color={selected ? '#2563eb' : color} />
        </mesh>
      )}

      {link.label && (
        <Html
          position={[
            labelPos.x + link.labelOffsetX / 40,
            labelPos.y + 0.3,
            labelPos.z + link.labelOffsetY / 40,
          ]}
          center
          style={{
            color: color,
            fontSize: '11px',
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 500,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {link.label}
        </Html>
      )}
    </group>
  );
}
