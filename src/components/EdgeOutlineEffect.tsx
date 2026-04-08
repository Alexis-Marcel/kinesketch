'use client';

import { useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useFBO } from '@react-three/drei';
import { EffectComposer } from '@react-three/postprocessing';
import { Effect } from 'postprocessing';
import * as THREE from 'three';

/** Layer used for selective edge detection — only meshes on this layer get outlines */
export const OUTLINE_LAYER = 1;

// ---------- Custom postprocessing Effect ----------

const outlineFragmentShader = /* glsl */ `
  uniform sampler2D tDepth;
  uniform sampler2D tNormal;
  uniform float cameraNear;
  uniform float cameraFar;
  uniform vec2 resolution;

  float readDepth(vec2 coord) {
    float fragCoordZ = texture2D(tDepth, coord).x;
    // perspectiveDepthToViewZ
    float viewZ = (cameraNear * cameraFar) / ((cameraFar - cameraNear) * fragCoordZ - cameraFar);
    // viewZToOrthographicDepth
    return (viewZ + cameraNear) / (cameraNear - cameraFar);
  }

  float luma(vec3 color) {
    return dot(color, vec3(0.2125, 0.7154, 0.0721));
  }

  void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
    vec2 texel = 1.0 / resolution;
    float t = 1.5;

    // Depth Sobel (3x3)
    float d00 = readDepth(uv + t * texel * vec2(-1, -1));
    float d01 = readDepth(uv + t * texel * vec2(-1,  0));
    float d02 = readDepth(uv + t * texel * vec2(-1,  1));
    float d10 = readDepth(uv + t * texel * vec2( 0, -1));
    float d12 = readDepth(uv + t * texel * vec2( 0,  1));
    float d20 = readDepth(uv + t * texel * vec2( 1, -1));
    float d21 = readDepth(uv + t * texel * vec2( 1,  0));
    float d22 = readDepth(uv + t * texel * vec2( 1,  1));

    float xD = -1.0*d00 - 2.0*d01 - 1.0*d02 + 1.0*d20 + 2.0*d21 + 1.0*d22;
    float yD = -1.0*d00 + 1.0*d02 - 2.0*d10 + 2.0*d12 - 1.0*d20 + 1.0*d22;
    float depthEdge = sqrt(xD * xD + yD * yD);

    // Normal Sobel (3x3)
    float n00 = luma(texture2D(tNormal, uv + t * texel * vec2(-1, -1)).rgb);
    float n01 = luma(texture2D(tNormal, uv + t * texel * vec2(-1,  0)).rgb);
    float n02 = luma(texture2D(tNormal, uv + t * texel * vec2(-1,  1)).rgb);
    float n10 = luma(texture2D(tNormal, uv + t * texel * vec2( 0, -1)).rgb);
    float n12 = luma(texture2D(tNormal, uv + t * texel * vec2( 0,  1)).rgb);
    float n20 = luma(texture2D(tNormal, uv + t * texel * vec2( 1, -1)).rgb);
    float n21 = luma(texture2D(tNormal, uv + t * texel * vec2( 1,  0)).rgb);
    float n22 = luma(texture2D(tNormal, uv + t * texel * vec2( 1,  1)).rgb);

    float xN = -1.0*n00 - 2.0*n01 - 1.0*n02 + 1.0*n20 + 2.0*n21 + 1.0*n22;
    float yN = -1.0*n00 + 1.0*n02 - 2.0*n10 + 2.0*n12 - 1.0*n20 + 1.0*n22;
    float normalEdge = sqrt(xN * xN + yN * yN);

    // Smoothstep for clean antialiased lines, tuned to catch silhouettes only
    float raw = depthEdge * 25.0 + normalEdge * 1.5;
    float outline = smoothstep(0.4, 0.6, raw);

    vec3 edgeColor = vec3(0.0);
    outputColor = vec4(mix(inputColor.rgb, edgeColor, outline), inputColor.a);
  }
`;

class SobelOutlineEffect extends Effect {
  constructor(opts: {
    depthTexture: THREE.Texture;
    normalTexture: THREE.Texture;
    cameraNear: number;
    cameraFar: number;
    resolution: THREE.Vector2;
  }) {
    super('SobelOutlineEffect', outlineFragmentShader, {
      uniforms: new Map<string, THREE.Uniform>([
        ['tDepth', new THREE.Uniform(opts.depthTexture)],
        ['tNormal', new THREE.Uniform(opts.normalTexture)],
        ['cameraNear', new THREE.Uniform(opts.cameraNear)],
        ['cameraFar', new THREE.Uniform(opts.cameraFar)],
        ['resolution', new THREE.Uniform(opts.resolution)],
      ]),
    });
  }
}

// ---------- React Component ----------

function SelectiveBuffers({ effect }: { effect: SobelOutlineEffect }) {
  const { gl, scene, camera, size, viewport } = useThree();
  const normalMat = useMemo(() => new THREE.MeshNormalMaterial(), []);

  // Use actual pixel resolution (accounts for device pixel ratio)
  const w = Math.floor(size.width * viewport.dpr);
  const h = Math.floor(size.height * viewport.dpr);

  const depthTarget = useMemo(() => {
    const dt = new THREE.DepthTexture(w, h);
    dt.format = THREE.DepthFormat;
    dt.type = THREE.UnsignedIntType;
    return new THREE.WebGLRenderTarget(w, h, {
      depthTexture: dt,
      depthBuffer: true,
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
    });
  }, [w, h]);

  const normalTarget = useFBO(w, h, {
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    type: THREE.HalfFloatType,
  });

  // Render selective depth + normals BEFORE the main render
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;

    // Update effect uniforms
    effect.uniforms.get('tDepth')!.value = depthTarget.depthTexture;
    effect.uniforms.get('tNormal')!.value = normalTarget.texture;
    effect.uniforms.get('cameraNear')!.value = cam.near;
    effect.uniforms.get('cameraFar')!.value = cam.far;
    effect.uniforms.get('resolution')!.value.set(w, h);

    // Switch to outline layer only
    const savedMask = camera.layers.mask;
    camera.layers.set(OUTLINE_LAYER);

    // Render depth (selective)
    gl.setRenderTarget(depthTarget);
    gl.clear();
    gl.render(scene, camera);

    // Render normals (selective)
    const savedOverride = scene.overrideMaterial;
    scene.overrideMaterial = normalMat;
    gl.setRenderTarget(normalTarget);
    gl.clear();
    gl.render(scene, camera);
    scene.overrideMaterial = savedOverride;

    // Restore
    camera.layers.mask = savedMask;
    gl.setRenderTarget(null);
  }, -1); // priority -1: before R3F's default render

  return null;
}

export function EdgeOutlineComposer({ children }: { children: React.ReactNode }) {
  const { camera, size } = useThree();

  const effect = useMemo(() => {
    const cam = camera as THREE.PerspectiveCamera;
    return new SobelOutlineEffect({
      depthTexture: new THREE.Texture(), // placeholder, updated in useFrame
      normalTexture: new THREE.Texture(),
      cameraNear: cam.near,
      cameraFar: cam.far,
      resolution: new THREE.Vector2(size.width, size.height),
    });
  }, [camera, size]);

  return (
    <>
      {children}
      <SelectiveBuffers effect={effect} />
      <EffectComposer>
        <primitive object={effect} dispose={null} />
      </EffectComposer>
    </>
  );
}
