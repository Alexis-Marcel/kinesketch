'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas as R3FCanvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewport, Line, TransformControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { useDiagramStore } from '../store/diagramStore';
import { ShapeRenderer3D } from './ShapeRenderer3D';
import { LinkRenderer3D } from './LinkRenderer3D';
import { EdgeOutlineComposer } from './EdgeOutlineEffect';
import { snap } from '../utils/snap';
import { getAnchors3D, anchor3DToWorld } from '../utils/anchors3d';

const WORLD_HALF = 10; // working area in grid units
const CLICK_THRESHOLD = 4; // max px movement to count as a click

/** Fixed grid — matches 2D grid: minor every 2 units, major every 4 units */
function FixedGrid() {
  const { gridPoints, sectionPoints, xAxisPoints, zAxisPoints } = useMemo(() => {
    const grid: Array<[number, number, number][]> = [];
    const section: Array<[number, number, number][]> = [];
    const step = 2; // minor grid = 2 store units (matches 2D MINOR_GRID=20px / CELL=10)

    for (let i = -WORLD_HALF; i <= WORLD_HALF; i += step) {
      const isSection = i % 4 === 0; // major grid = 4 store units (matches 2D MAJOR_GRID=40px / CELL=10)
      const pts: [number, number, number][] = [
        [-WORLD_HALF, 0, i],
        [WORLD_HALF, 0, i],
      ];
      const ptsZ: [number, number, number][] = [
        [i, 0, -WORLD_HALF],
        [i, 0, WORLD_HALF],
      ];
      if (isSection) {
        section.push(pts, ptsZ);
      } else {
        grid.push(pts, ptsZ);
      }
    }

    return {
      gridPoints: grid,
      sectionPoints: section,
      xAxisPoints: [[0, 0.005, 0], [WORLD_HALF, 0.005, 0]] as [number, number, number][],
      zAxisPoints: [[0, 0.005, 0], [0, 0.005, WORLD_HALF]] as [number, number, number][],
    };
  }, []);

  return (
    <group>
      {gridPoints.map((pts, i) => (
        <Line key={`g${i}`} points={pts} color="#e0e0e0" lineWidth={0.5} />
      ))}
      {sectionPoints.map((pts, i) => (
        <Line key={`s${i}`} points={pts} color="#b0b0b0" lineWidth={1} />
      ))}
      <Line points={xAxisPoints} color="#ef4444" lineWidth={1.5} />
      <Line points={zAxisPoints} color="#3b82f6" lineWidth={1.5} />
    </group>
  );
}

/** Invisible ground plane for raycasting clicks */
function GroundPlane({ onClick, onPointerDown, onPointerMove }: {
  onClick: (e: ThreeEvent<MouseEvent>) => void;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onPointerMove?: (e: ThreeEvent<PointerEvent>) => void;
}) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.01, 0]}
      onClick={onClick}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      visible={false}
    >
      <planeGeometry args={[WORLD_HALF * 2, WORLD_HALF * 2]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}

/** Compute centroid of all nodes — orbit target */
function useSceneCenter() {
  const nodes = useDiagramStore((s) => s.nodes);
  return useMemo(() => {
    if (nodes.size === 0) return new THREE.Vector3(0, 0, 0);
    let sx = 0, sy = 0, sz = 0;
    for (const n of nodes.values()) {
      sx += n.x;
      sy += n.y;
      sz += n.z;
    }
    const count = nodes.size;
    return new THREE.Vector3(sx / count, sy / count, sz / count);
  }, [nodes]);
}

/** Custom camera controls: trackpad pan + pinch zoom + space-drag orbit */
function CameraControls({ controlsRef }: { controlsRef: React.RefObject<OrbitControlsImpl | null> }) {
  const { gl, camera } = useThree();
  const spacePressed = useRef(false);

  useEffect(() => {
    const dom = gl.domElement;
    dom.style.touchAction = 'none';

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const ctrl = controlsRef.current;
      if (!ctrl) return;

      if (e.ctrlKey) {
        // Pinch zoom (trackpad) or Ctrl+wheel
        const cam = camera as THREE.PerspectiveCamera;
        const dir = new THREE.Vector3();
        cam.getWorldDirection(dir);
        const distance = cam.position.distanceTo(ctrl.target);
        const zoomFactor = 1 + e.deltaY * 0.01;
        const newDistance = Math.max(3, Math.min(25, distance * zoomFactor));
        const newPos = ctrl.target.clone().add(dir.multiplyScalar(-newDistance));
        cam.position.copy(newPos);
        ctrl.update();
      } else {
        // Trackpad 2-finger scroll = pan
        const cam = camera as THREE.PerspectiveCamera;
        const distance = cam.position.distanceTo(ctrl.target);
        const panScale = distance * 0.001;
        const right = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);
        cam.getWorldDirection(right);
        right.cross(up).normalize();
        const camUp = new THREE.Vector3().crossVectors(right, new THREE.Vector3().subVectors(cam.position, ctrl.target).normalize()).normalize();

        const offset = new THREE.Vector3()
          .addScaledVector(right, -e.deltaX * panScale)
          .addScaledVector(camUp, e.deltaY * panScale);

        cam.position.add(offset);
        ctrl.target.add(offset);
        ctrl.update();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !spacePressed.current) {
        spacePressed.current = true;
        const ctrl = controlsRef.current;
        if (ctrl) ctrl.mouseButtons.LEFT = THREE.MOUSE.ROTATE;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressed.current = false;
        const ctrl = controlsRef.current;
        if (ctrl) ctrl.mouseButtons.LEFT = undefined as unknown as THREE.MOUSE;
      }
    };

    dom.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      dom.removeEventListener('wheel', handleWheel);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gl, camera, controlsRef]);

  return null;
}

function Scene() {
  const nodes = useDiagramStore((s) => s.nodes);
  const links = useDiagramStore((s) => s.links);
  const solides = useDiagramStore((s) => s.solides);
  const selectedIds = useDiagramStore((s) => s.selectedIds);
  const activeTool = useDiagramStore((s) => s.activeTool);
  const linkSource = useDiagramStore((s) => s.linkSource);
  // 3D only supports node-as-source (no link-line source).
  const linkSourceId = linkSource?.kind === 'node' ? linkSource.nodeId : null;
  const center = useSceneCenter();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);
  const [sourceAnchorIdx, setSourceAnchorIdx] = useState<number | undefined>(undefined);
  const [mousePos3D, setMousePos3D] = useState<[number, number, number] | null>(null);
  const [linkSnapTarget, setLinkSnapTarget] = useState<string | null>(null);
  const [linkTargetAnchorIdx, setLinkTargetAnchorIdx] = useState<number | undefined>(undefined);
  const store = useDiagramStore;

  const LINK_SNAP_RADIUS_3D = 4; // world units to detect nearby node

  /**
   * Update link hover state based on a world-space mouse position.
   * Always computes the nearest node and its nearest anchor (no requirement on linkSourceId).
   */
  const updateLinkHover = useCallback(
    (worldX: number, worldY: number, worldZ: number) => {
      // Find nearest node within radius
      let nearestNodeId: string | null = null;
      let nearestDist = Infinity;
      for (const node of nodes.values()) {
        if (linkSourceId === node.id) continue; // exclude source
        const dx = worldX - node.x;
        const dy = worldY - node.y;
        const dz = worldZ - node.z;
        const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (d < LINK_SNAP_RADIUS_3D && d < nearestDist) {
          nearestDist = d;
          nearestNodeId = node.id;
        }
      }

      if (nearestNodeId) {
        const targetNode = nodes.get(nearestNodeId);
        if (targetNode) {
          const anchors = getAnchors3D(targetNode.type, targetNode.view);
          let bestIdx: number | undefined;
          let bestDist = Infinity;
          let bestPos: [number, number, number] = [worldX, worldY, worldZ];
          for (let i = 0; i < anchors.length; i++) {
            const w = anchor3DToWorld(anchors[i], targetNode);
            const d = (w.x - worldX) ** 2 + (w.y - worldY) ** 2 + (w.z - worldZ) ** 2;
            if (d < bestDist) {
              bestDist = d;
              bestIdx = i;
              bestPos = [w.x, w.y, w.z];
            }
          }
          setLinkSnapTarget(nearestNodeId);
          setLinkTargetAnchorIdx(bestIdx);
          if (linkSourceId) setMousePos3D(bestPos);
          return;
        }
      }

      setLinkSnapTarget(null);
      setLinkTargetAnchorIdx(undefined);
      if (linkSourceId) setMousePos3D([worldX, worldY, worldZ]);
    },
    [nodes, linkSourceId],
  );

  // Compute ghost line endpoints when in link mode with a source
  const ghostLine = useMemo(() => {
    if (!linkSourceId || sourceAnchorIdx === undefined || !mousePos3D) return null;
    const sourceNode = nodes.get(linkSourceId);
    if (!sourceNode) return null;
    const anchors = getAnchors3D(sourceNode.type, sourceNode.view);
    if (sourceAnchorIdx >= anchors.length) return null;
    const anchorWorld = anchor3DToWorld(anchors[sourceAnchorIdx], sourceNode);
    return {
      from: [anchorWorld.x, anchorWorld.y, anchorWorld.z] as [number, number, number],
      to: mousePos3D,
    };
  }, [linkSourceId, sourceAnchorIdx, mousePos3D, nodes]);

  // Single selected node for TransformControls
  const singleSelectedNode = useMemo(() => {
    if (selectedIds.size !== 1) return null;
    const id = Array.from(selectedIds)[0];
    return nodes.get(id) ?? null;
  }, [selectedIds, nodes]);

  const isClick = useCallback((e: { nativeEvent: { clientX: number; clientY: number } }) => {
    if (!pointerDownPos.current) return false;
    const dx = e.nativeEvent.clientX - pointerDownPos.current.x;
    const dy = e.nativeEvent.clientY - pointerDownPos.current.y;
    return Math.abs(dx) < CLICK_THRESHOLD && Math.abs(dy) < CLICK_THRESHOLD;
  }, []);

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    pointerDownPos.current = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
  }, []);

  const handleGroundClick = useCallback(
    (e: ThreeEvent<MouseEvent>) => {
      if (!isClick(e)) return;
      const state = store.getState();

      if (state.activeTool === 'place' && state.placingLiaison) {
        const point = e.point;
        if (point) {
          const x = snap(point.x);
          const z = snap(point.z);
          state.addNode(state.placingLiaison.type, x, 0, state.placingLiaison.view, z);
        }
      } else if (state.activeTool === 'link') {
        // If snapped to a target anchor, complete/start the link
        if (linkSnapTarget && linkTargetAnchorIdx !== undefined) {
          const sourceNodeId = state.linkSource?.kind === 'node' ? state.linkSource.nodeId : null;
          if (!sourceNodeId) {
            state.setLinkSource({ kind: 'node', nodeId: linkSnapTarget });
            setSourceAnchorIdx(linkTargetAnchorIdx);
          } else if (sourceNodeId !== linkSnapTarget) {
            state.addLink({ kind: 'node', nodeId: sourceNodeId, anchorIdx: sourceAnchorIdx }, { kind: 'node', nodeId: linkSnapTarget, anchorIdx: linkTargetAnchorIdx });
            state.setLinkSource(null);
            setSourceAnchorIdx(undefined);
            setLinkSnapTarget(null);
            setLinkTargetAnchorIdx(undefined);
            setMousePos3D(null);
          }
        } else {
          // Click in empty space — cancel
          state.setLinkSource(null);
          setSourceAnchorIdx(undefined);
          setMousePos3D(null);
        }
      } else if (state.activeTool === 'select') {
        state.clearSelection();
      }
    },
    [store, isClick, linkSnapTarget, linkTargetAnchorIdx, sourceAnchorIdx]
  );

  const handleAnchorClick = useCallback(
    (nodeId: string, anchorIdx: number) => {
      const state = store.getState();
      if (state.activeTool !== 'link') return;
      const sourceNodeId = state.linkSource?.kind === 'node' ? state.linkSource.nodeId : null;
      if (!sourceNodeId) {
        state.setLinkSource({ kind: 'node', nodeId: nodeId });
        setSourceAnchorIdx(anchorIdx);
      } else if (sourceNodeId !== nodeId) {
        state.addLink({ kind: 'node', nodeId: sourceNodeId, anchorIdx: sourceAnchorIdx }, { kind: 'node', nodeId: nodeId, anchorIdx: anchorIdx });
        state.setLinkSource(null);
        setSourceAnchorIdx(undefined);
        setMousePos3D(null);
        setLinkSnapTarget(null);
        setLinkTargetAnchorIdx(undefined);
      }
    },
    [store, sourceAnchorIdx],
  );

  const handleNodeClick = useCallback(
    (nodeId: string, e: ThreeEvent<MouseEvent>) => {
      if (!isClick(e)) return;
      const state = store.getState();
      if (state.activeTool === 'link') {
        // Links can only be created via anchor clicks (handleAnchorClick)
      } else {
        state.select(nodeId);
      }
    },
    [store, isClick]
  );

  return (
    <>
      {/* Background */}
      <color attach="background" args={['#fafafa']} />

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} />

      {/* Camera controls — modern UX:
          - Trackpad 2 fingers / wheel: pan
          - Pinch (ctrl+wheel): zoom
          - Right-click drag or Space+drag: orbit
          - Middle-click drag: pan */}
      <CameraControls controlsRef={controlsRef} />
      <OrbitControls
        ref={controlsRef}
        makeDefault
        target={center}
        enablePan={false}
        enableZoom={false}
        enableRotate
        minDistance={3}
        maxDistance={25}
        maxPolarAngle={Math.PI * 0.48}
        minPolarAngle={Math.PI * 0.05}
        rotateSpeed={0.6}
        enableDamping
        dampingFactor={0.12}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: undefined as unknown as THREE.MOUSE,
          RIGHT: THREE.MOUSE.ROTATE,
        }}
      />

      {/* Fixed grid — always visible */}
      <FixedGrid />

      {/* Ground plane for click detection */}
      <GroundPlane
        onClick={handleGroundClick}
        onPointerDown={handlePointerDown}
        onPointerMove={(e) => {
          if (activeTool === 'link') {
            updateLinkHover(e.point.x, e.point.y, e.point.z);
          }
        }}
      />

      {/* Ghost line during link creation */}
      {ghostLine && (
        <Line points={[ghostLine.from, ghostLine.to]} color="#2563eb" lineWidth={1.5} dashed dashSize={0.2} gapSize={0.1} />
      )}

      {/* Axis gizmo in corner */}
      <GizmoHelper alignment="bottom-left" margin={[60, 60]}>
        <GizmoViewport labelColor="white" axisHeadScale={0.8} />
      </GizmoHelper>

      {/* Render links with anchor resolution */}
      {Array.from(links.values()).map((link) => {
        const fromNode = nodes.get(link.fromNodeId);
        const toNode = nodes.get(link.toNodeId);
        if (!fromNode || !toNode) return null;
        const solide = solides.get(link.solideId);

        // Build solide mapping for each node
        const buildMapping = (nodeId: string) => {
          let a: string | null = null;
          let b: string | null = null;
          for (const l of links.values()) {
            let idx: number | undefined;
            if (l.fromNodeId === nodeId) idx = l.fromAnchorIdx;
            else if (l.toNodeId === nodeId) idx = l.toAnchorIdx;
            else continue;
            const node = nodes.get(nodeId);
            if (!node) continue;
            const anchors = getAnchors3D(node.type, node.view);
            if (idx !== undefined && idx < anchors.length) {
              const side = anchors[idx].side;
              if (side === 'A' && !a) a = l.solideId;
              else if (side === 'B' && !b) b = l.solideId;
            } else {
              if (!a) a = l.solideId;
              else if (!b) b = l.solideId;
            }
          }
          return { a, b };
        };

        return (
          <LinkRenderer3D
            key={link.id}
            link={link}
            fromNode={fromNode}
            toNode={toNode}
            color={solide?.color || '#9ca3af'}
            selected={selectedIds.has(link.id)}
            fromSolideMapping={buildMapping(link.fromNodeId)}
            toSolideMapping={buildMapping(link.toNodeId)}
            onClick={(e) => {
              if (!isClick(e)) return;
              const state = store.getState();
              if (state.activeTool === 'select') {
                state.select(link.id);
              }
            }}
            onPointerDown={handlePointerDown}
          />
        );
      })}

      {/* Render nodes */}
      {Array.from(nodes.values()).map((node) => {
        const nodeLinks = Array.from(links.values()).filter(
          (l) => l.fromNodeId === node.id || l.toNodeId === node.id
        );
        const solideColors = nodeLinks.map((l) => solides.get(l.solideId)?.color || '#9ca3af');
        const colorA = solideColors[0] || '#9ca3af';
        const colorB = solideColors[1] || solideColors[0] || '#9ca3af';

        return (
          <ShapeRenderer3D
            key={node.id}
            node={node}
            selected={selectedIds.has(node.id)}
            colorA={colorA}
            colorB={colorB}
            onClick={(e) => handleNodeClick(node.id, e)}
            onPointerDown={handlePointerDown}
            onAnchorClick={handleAnchorClick}
            onPointerMoveNode={(e) => {
              if (activeTool === 'link') {
                updateLinkHover(e.point.x, e.point.y, e.point.z);
              }
            }}
            showAnchors={
              activeTool === 'link' &&
              (linkSourceId === node.id || linkSnapTarget === node.id)
            }
            highlightedAnchorIdx={linkSnapTarget === node.id ? linkTargetAnchorIdx : undefined}
          />
        );
      })}

      {/* Transform gizmo on selected node */}
      {singleSelectedNode && (
        <TransformControls
          mode="translate"
          position={[singleSelectedNode.x, singleSelectedNode.y, singleSelectedNode.z]}
          size={0.7}
          onMouseDown={() => {
            if (controlsRef.current) controlsRef.current.enabled = false;
          }}
          onMouseUp={() => {
            if (controlsRef.current) controlsRef.current.enabled = true;
          }}
          onObjectChange={(e) => {
            const obj = (e?.target as unknown as { object: THREE.Object3D })?.object;
            if (!obj || !singleSelectedNode) return;
            const pos = obj.position;
            store.getState().moveNode(
              singleSelectedNode.id,
              snap(pos.x),
              snap(pos.y),
              snap(pos.z)
            );
          }}
        />
      )}

      {/* Sobel edge detection — silhouettes view-dependent on toutes les meshes du layer 1 */}
      <EdgeOutlineComposer>
        <></>
      </EdgeOutlineComposer>
    </>
  );
}

export function Canvas3D() {
  return (
    <div className="canvas-wrapper" style={{ width: '100%', height: '100%' }}>
      <R3FCanvas
        camera={{
          position: [8, 6, 8],
          fov: 50,
          near: 0.1,
          far: 100,
        }}
        style={{ background: '#fafafa' }}
        dpr={[1, 2]}
        gl={{ antialias: true }}
      >
        <Scene />
      </R3FCanvas>
    </div>
  );
}
