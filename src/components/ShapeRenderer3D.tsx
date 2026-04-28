'use client';

import { useRef, useEffect, type ComponentType } from 'react';
import { type ThreeEvent } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { DiagramNode, LiaisonType } from '../types';
import { useDiagramStore } from '../store/diagramStore';
import { getAnchors3D } from '../utils/anchors3d';
import type { Liaison3DProps } from '../liaisons3d/shared';
import { Pivot3D } from '../liaisons3d/Pivot3D';
import { Glissiere3D } from '../liaisons3d/Glissiere3D';
import { Rotule3D } from '../liaisons3d/Rotule3D';
import { Encastrement3D } from '../liaisons3d/Encastrement3D';
import { PivotGlissant3D } from '../liaisons3d/PivotGlissant3D';
import { Helicoidale3D } from '../liaisons3d/Helicoidale3D';
import { RotuleDoigt3D } from '../liaisons3d/RotuleDoigt3D';
import { AppuiPlan3D } from '../liaisons3d/AppuiPlan3D';
import { LineaireAnnulaire3D } from '../liaisons3d/LineaireAnnulaire3D';
import { LineaireRectiligne3D } from '../liaisons3d/LineaireRectiligne3D';
import { Ponctuelle3D } from '../liaisons3d/Ponctuelle3D';
import { Bati3D } from '../liaisons3d/Bati3D';
import { EngrenageExt3D } from '../liaisons3d/EngrenageExt3D';
import { EngrenageInt3D } from '../liaisons3d/EngrenageInt3D';
import { EngrenageConique3D } from '../liaisons3d/EngrenageConique3D';
import { DefaultLiaison3D } from '../liaisons3d/DefaultLiaison3D';

const LIAISON_3D_COMPONENTS: Partial<Record<LiaisonType, ComponentType<Liaison3DProps>>> = {
  pivot: Pivot3D,
  glissiere: Glissiere3D,
  pivot_glissant: PivotGlissant3D,
  rotule: Rotule3D,
  encastrement: Encastrement3D,
  helicoidale: Helicoidale3D,
  rotule_doigt: RotuleDoigt3D,
  appui_plan: AppuiPlan3D,
  lineaire_annulaire: LineaireAnnulaire3D,
  lineaire_rectiligne: LineaireRectiligne3D,
  ponctuelle: Ponctuelle3D,
  bati: Bati3D,
  engrenage_ext: EngrenageExt3D,
  engrenage_int: EngrenageInt3D,
  engrenage_conique: EngrenageConique3D,
};

interface ShapeRenderer3DProps {
  node: DiagramNode;
  selected: boolean;
  colorA: string;
  colorB: string;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  onPointerDown?: (e: ThreeEvent<PointerEvent>) => void;
  onAnchorClick: (nodeId: string, anchorIdx: number) => void;
  onPointerMoveNode?: (e: ThreeEvent<PointerEvent>) => void;
  showAnchors: boolean;
  highlightedAnchorIdx?: number;
}

export function ShapeRenderer3D({
  node,
  colorA,
  colorB,
  onClick,
  onPointerDown,
  onAnchorClick,
  onPointerMoveNode,
  showAnchors,
  highlightedAnchorIdx,
}: ShapeRenderer3DProps) {
  const groupRef = useRef<THREE.Group>(null);
  const linkSource = useDiagramStore((s) => s.linkSource);
  const linkSourceId = linkSource?.kind === 'node' ? linkSource.nodeId : null;
  const anchors = getAnchors3D(node.type, node.view);

  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.layers.enable(1);
      }
    });
  });

  const Component = LIAISON_3D_COMPONENTS[node.type];
  const liaisonProps: Liaison3DProps = { colorA, colorB, view: node.view };

  return (
    <group
      ref={groupRef}
      position={[node.x, node.y, node.z]}
      rotation={[
        (node.rotationX * Math.PI) / 180,
        (node.rotation * Math.PI) / 180,
        (node.rotationY * Math.PI) / 180,
      ]}
      scale={node.scale}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown?.(e);
      }}
      onPointerMove={(e) => {
        onPointerMoveNode?.(e);
      }}
    >
      {Component
        ? <Component {...liaisonProps} />
        : <DefaultLiaison3D {...liaisonProps} type={node.type} />}

      {/* Anchor points — visible in link mode when this node is hovered/snapped */}
      {showAnchors &&
        anchors.map((anchor, i) => {
          const isHighlighted = highlightedAnchorIdx === i;
          const isSource = linkSourceId === node.id;
          const anchorColor = anchor.side === 'A' ? colorA : colorB;
          return (
            <mesh
              key={`anchor-${i}`}
              position={[anchor.x, anchor.y, anchor.z]}
              onClick={(e) => {
                e.stopPropagation();
                onAnchorClick(node.id, i);
              }}
            >
              <sphereGeometry args={[0.3, 16, 16]} />
              <meshBasicMaterial
                color={isSource || isHighlighted ? '#2563eb' : anchorColor}
                transparent
                opacity={isHighlighted ? 1 : 0.6}
              />
            </mesh>
          );
        })}

      {/* Label */}
      {node.label && (
        <Html
          position={[node.labelOffsetX / 40, 1, node.labelOffsetY / 40]}
          center
          style={{
            color: '#9ca3af',
            fontSize: '12px',
            fontFamily: 'system-ui, sans-serif',
            fontWeight: 500,
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}
        >
          {node.label}
        </Html>
      )}
    </group>
  );
}
