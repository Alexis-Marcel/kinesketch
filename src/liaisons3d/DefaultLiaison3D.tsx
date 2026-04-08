'use client';

import { Html } from '@react-three/drei';
import type { Liaison3DProps } from './shared';
import type { LiaisonType } from '../types';
import { LIAISON_DEFS } from '../liaisons';

interface DefaultLiaison3DProps extends Liaison3DProps {
  type: LiaisonType;
}

export function DefaultLiaison3D({ type }: DefaultLiaison3DProps) {
  const def = LIAISON_DEFS[type];

  return (
    <group>
      <mesh>
        <octahedronGeometry args={[1, 0]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <Html
        position={[0, 1.5, 0]}
        center
        style={{
          color: '#6b7280',
          fontSize: '10px',
          fontFamily: 'system-ui',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
          userSelect: 'none',
          background: 'rgba(255,255,255,0.8)',
          padding: '1px 4px',
          borderRadius: '2px',
        }}
      >
        {def?.name || type}
      </Html>
    </group>
  );
}
