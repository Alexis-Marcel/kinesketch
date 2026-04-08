'use client';

import { useMemo, useEffect } from 'react';
import * as THREE from 'three';

interface OutlineMeshProps {
  color: string;
  edgeWidth?: number;
  children: React.ReactNode;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

/**
 * A mesh wrapper that renders white with dynamic colored silhouette edges.
 * Pass geometry as children (e.g. <cylinderGeometry />).
 */
export function OutlineMesh({ color, edgeWidth = 0.35, children, position, rotation }: OutlineMeshProps) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    uniforms: {
      edgeColor: { value: new THREE.Color(color) },
      edgeWidth: { value: edgeWidth },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewDir = normalize(-mvPos.xyz);
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3 edgeColor;
      uniform float edgeWidth;
      varying vec3 vNormal;
      varying vec3 vViewDir;
      void main() {
        float edge = 1.0 - abs(dot(vNormal, vViewDir));
        float line = smoothstep(1.0 - edgeWidth, 1.0 - edgeWidth * 0.05, edge);
        vec3 finalColor = mix(vec3(1.0), edgeColor, line);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  }), []);

  // Update uniforms when props change
  useEffect(() => {
    material.uniforms.edgeColor.value.set(color);
    material.uniforms.edgeWidth.value = edgeWidth;
  }, [color, edgeWidth, material]);

  return (
    <mesh position={position} rotation={rotation} material={material}>
      {children}
    </mesh>
  );
}
