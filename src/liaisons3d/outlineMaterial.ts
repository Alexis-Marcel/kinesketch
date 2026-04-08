import * as THREE from 'three';

/**
 * Custom ShaderMaterial that renders white with colored edges.
 * Uses Fresnel effect (dot product of normal and view direction) to detect silhouette edges.
 */
export function createOutlineMaterial(color: string, lineWidth = 0.3): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      edgeColor: { value: new THREE.Color(color) },
      edgeWidth: { value: lineWidth },
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
        // Sharpen the edge with smoothstep
        float line = smoothstep(1.0 - edgeWidth, 1.0 - edgeWidth * 0.3, edge);
        // Mix white interior with colored edge
        vec3 finalColor = mix(vec3(1.0), edgeColor, line);
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `,
  });
}
