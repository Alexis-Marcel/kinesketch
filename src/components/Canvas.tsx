import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { Stage, Layer, Line, Rect, Circle, Group } from 'react-konva';
import type Konva from 'konva';
import { useDiagramStore } from '../store/diagramStore';
import { ShapeRenderer } from './ShapeRenderer';
import { LinkRenderer } from './LinkRenderer';
import { LocalFrameRenderer } from './LocalFrameRenderer';
import { AngleArcRenderer } from './AngleArcRenderer';
import { AxisWidget } from './AxisWidget';
import type { LiaisonType } from '../types';
import { snap } from '../utils/snap';
import { getBestAnchor, getAnchors, anchorToWorld, type SolideMapping } from '../utils/anchors';

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const GRID_SIZE = 40;
const SELECTION_PAD = 26;
const ROTATION_HANDLE_DIST = 44;
const LINK_SNAP_RADIUS = 40; // px in world coords — snap ghost line to nearby nodes

export function Canvas() {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [dragOver, setDragOver] = useState(false);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingPos, setEditingPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectionRect, setSelectionRect] = useState<{ x1: number; y1: number; x2: number; y2: number } | null>(null);
  const [cursorMode, setCursorMode] = useState<'default' | 'grab' | 'grabbing'>('default');
  const [linkSnapTarget, setLinkSnapTarget] = useState<string | null>(null);
  const [linkHoverNodeId, setLinkHoverNodeId] = useState<string | null>(null);
  const [linkSourceAnchorIdx, setLinkSourceAnchorIdx] = useState<number | undefined>(undefined);
  const [linkTargetAnchorIdx, setLinkTargetAnchorIdx] = useState<number | undefined>(undefined);
  const isSelecting = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const spacePressed = useRef(false);
  const isRotating = useRef(false);
  const rotatingNodeId = useRef<string | null>(null);
  const didSelect = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const nodes = useDiagramStore((s) => s.nodes);
  const links = useDiagramStore((s) => s.links);
  const solides = useDiagramStore((s) => s.solides);
  const angleArcs = useDiagramStore((s) => s.angleArcs);
  const selectedIds = useDiagramStore((s) => s.selectedIds);
  const activeTool = useDiagramStore((s) => s.activeTool);
  const placingLiaison = useDiagramStore((s) => s.placingLiaison);
  const linkSourceId = useDiagramStore((s) => s.linkSourceId);
  const stageX = useDiagramStore((s) => s.stageX);
  const stageY = useDiagramStore((s) => s.stageY);
  const stageScale = useDiagramStore((s) => s.stageScale);

  const addNode = useDiagramStore((s) => s.addNode);
  const moveNode = useDiagramStore((s) => s.moveNode);
  const moveNodes = useDiagramStore((s) => s.moveNodes);
  const rotateNode = useDiagramStore((s) => s.rotateNode);
  const select = useDiagramStore((s) => s.select);
  const selectMultiple = useDiagramStore((s) => s.selectMultiple);
  const clearSelection = useDiagramStore((s) => s.clearSelection);
  const setStagePosition = useDiagramStore((s) => s.setStagePosition);
  const setStageScale = useDiagramStore((s) => s.setStageScale);
  const addLink = useDiagramStore((s) => s.addLink);
  const setLinkSource = useDiagramStore((s) => s.setLinkSource);
  const setTool = useDiagramStore((s) => s.setTool);
  const updateNodeLabel = useDiagramStore((s) => s.updateNodeLabel);
  const updateNodeLabelOffset = useDiagramStore((s) => s.updateNodeLabelOffset);
  const updateLinkLabel = useDiagramStore((s) => s.updateLinkLabel);
  const updateLinkLabelOffset = useDiagramStore((s) => s.updateLinkLabelOffset);
  const moveSolideFrame = useDiagramStore((s) => s.moveSolideFrame);
  const updateSolideFrameLabel = useDiagramStore((s) => s.updateSolideFrameLabel);
  const moveAngleArc = useDiagramStore((s) => s.moveAngleArc);
  const updateAngleArcLabel = useDiagramStore((s) => s.updateAngleArcLabel);
  const updateAngleArcLabelOffset = useDiagramStore((s) => s.updateAngleArcLabelOffset);

  // Detect nodes connected to bâti (S0)
  const batiNodeIds = useMemo(() => {
    const ids = new Set<string>();
    for (const link of links.values()) {
      if (link.solideId === 's0') {
        ids.add(link.fromNodeId);
        ids.add(link.toNodeId);
      }
    }
    return ids;
  }, [links]);

  // Compute per-node solide colors based on anchor side (A or B)
  const nodeColors = useMemo(() => {
    const map = new Map<string, [string, string]>();
    for (const node of nodes.values()) {
      let sideASolideId: string | null = null;
      let sideBSolideId: string | null = null;
      const anchors = getAnchors(node.type, node.view);

      for (const link of links.values()) {
        let anchorIdx: number | undefined;
        if (link.fromNodeId === node.id) {
          anchorIdx = link.fromAnchorIdx;
        } else if (link.toNodeId === node.id) {
          anchorIdx = link.toAnchorIdx;
        } else {
          continue;
        }

        if (anchorIdx !== undefined && anchorIdx < anchors.length) {
          const side = anchors[anchorIdx].side;
          if (side === 'A' && !sideASolideId) sideASolideId = link.solideId;
          else if (side === 'B' && !sideBSolideId) sideBSolideId = link.solideId;
        } else {
          // No pinned anchor — assign to first available side
          if (!sideASolideId) sideASolideId = link.solideId;
          else if (!sideBSolideId) sideBSolideId = link.solideId;
        }
      }

      const cA = sideASolideId ? (solides.get(sideASolideId)?.color || '#1a1a1a') : '#1a1a1a';
      const cB = sideBSolideId ? (solides.get(sideBSolideId)?.color || '#1a1a1a') : cA;
      map.set(node.id, [cA, cB]);
    }
    return map;
  }, [nodes, links, solides]);

  // Compute per-node solide ID mapping based on anchor side
  const nodeSolideMapping = useMemo(() => {
    const map = new Map<string, SolideMapping>();
    for (const node of nodes.values()) {
      let sideASolideId: string | null = null;
      let sideBSolideId: string | null = null;
      const anchors = getAnchors(node.type, node.view);

      for (const link of links.values()) {
        let anchorIdx: number | undefined;
        if (link.fromNodeId === node.id) {
          anchorIdx = link.fromAnchorIdx;
        } else if (link.toNodeId === node.id) {
          anchorIdx = link.toAnchorIdx;
        } else {
          continue;
        }

        if (anchorIdx !== undefined && anchorIdx < anchors.length) {
          const side = anchors[anchorIdx].side;
          if (side === 'A' && !sideASolideId) sideASolideId = link.solideId;
          else if (side === 'B' && !sideBSolideId) sideBSolideId = link.solideId;
        } else {
          if (!sideASolideId) sideASolideId = link.solideId;
          else if (!sideBSolideId) sideBSolideId = link.solideId;
        }
      }

      map.set(node.id, { a: sideASolideId, b: sideBSolideId });
    }
    return map;
  }, [nodes, links]);

  // Track Space key for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        spacePressed.current = true;
        setCursorMode('grab');
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        spacePressed.current = false;
        if (!isPanning.current) setCursorMode('default');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Resize — observe container size instead of hard-coded offsets
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ width, height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Focus input when editing
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  // Zoom with scroll wheel
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();
      const stage = stageRef.current;
      if (!stage) return;

      // Pinch-to-zoom (ctrlKey is set by the browser for trackpad pinch)
      // or regular mouse wheel with Ctrl held
      if (e.evt.ctrlKey || e.evt.metaKey) {
        const oldScale = stageScale;
        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        const mousePointTo = {
          x: (pointer.x - stageX) / oldScale,
          y: (pointer.y - stageY) / oldScale,
        };

        // Pinch deltaY is smaller, use a smoother factor
        const zoomFactor = 1 - e.evt.deltaY * 0.01;
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, oldScale * zoomFactor));

        const newPos = {
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale,
        };

        setStageScale(newScale);
        setStagePosition(newPos.x, newPos.y);
      } else {
        // Two-finger scroll on trackpad or mouse wheel without Ctrl = pan
        setStagePosition(stageX - e.evt.deltaX, stageY - e.evt.deltaY);
      }
    },
    [stageScale, stageX, stageY, setStageScale, setStagePosition]
  );

  // Click on empty canvas
  const handleStageClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (e.target !== e.target.getStage()) return;
      if (isPanning.current) return;
      if (didSelect.current) {
        didSelect.current = false;
        return;
      }

      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const x = (pointer.x - stageX) / stageScale;
      const y = (pointer.y - stageY) / stageScale;

      if (activeTool === 'place' && placingLiaison) {
        addNode(placingLiaison.type, snap(x), snap(y), placingLiaison.view);
      } else if (activeTool === 'link') {
        // If snapped to a target node, complete the link
        if (linkSourceId && linkSnapTarget) {
          addLink(linkSourceId, linkSnapTarget, linkSourceAnchorIdx, linkTargetAnchorIdx);
          setLinkSource(null);
          setMousePos(null);
          setLinkSnapTarget(null);
          setLinkSourceAnchorIdx(undefined);
          setLinkTargetAnchorIdx(undefined);
        } else {
          setLinkSource(null);
          setMousePos(null);
          setLinkSnapTarget(null);
          setLinkSourceAnchorIdx(undefined);
          setLinkTargetAnchorIdx(undefined);
          setTool('select');
        }
      } else {
        clearSelection();
      }
    },
    [activeTool, placingLiaison, stageX, stageY, stageScale, addNode, clearSelection, setLinkSource, setTool, linkSourceId, linkSnapTarget, linkSourceAnchorIdx, linkTargetAnchorIdx, addLink]
  );

  // Handle node click for link tool (no specific anchor — uses tracked target anchor)
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (activeTool === 'link') {
        if (!linkSourceId) {
          setLinkSource(nodeId);
          setLinkSourceAnchorIdx(undefined);
        } else if (linkSourceId !== nodeId) {
          addLink(linkSourceId, nodeId, linkSourceAnchorIdx, linkTargetAnchorIdx);
          setLinkSource(null);
          setMousePos(null);
          setLinkSnapTarget(null);
          setLinkSourceAnchorIdx(undefined);
          setLinkTargetAnchorIdx(undefined);
        }
      } else {
        select(nodeId);
      }
    },
    [activeTool, linkSourceId, linkSourceAnchorIdx, linkTargetAnchorIdx, setLinkSource, addLink, select]
  );

  // Handle anchor click for link tool (specific anchor — pinned mode)
  const handleAnchorClick = useCallback(
    (nodeId: string, anchorIdx: number) => {
      if (activeTool !== 'link') return;
      if (!linkSourceId) {
        setLinkSource(nodeId);
        setLinkSourceAnchorIdx(anchorIdx);
      } else if (linkSourceId !== nodeId) {
        addLink(linkSourceId, nodeId, linkSourceAnchorIdx, anchorIdx);
        setLinkSource(null);
        setMousePos(null);
        setLinkSnapTarget(null);
        setLinkSourceAnchorIdx(undefined);
        setLinkTargetAnchorIdx(undefined);
      }
    },
    [activeTool, linkSourceId, linkSourceAnchorIdx, setLinkSource, addLink]
  );

  // Double-click to edit label
  const handleNodeDblClick = useCallback(
    (nodeId: string) => {
      const node = nodes.get(nodeId);
      if (!node) return;
      const screenX = node.x * stageScale + stageX;
      const screenY = node.y * stageScale + stageY;
      setEditingId(nodeId);
      setEditingValue(node.label);
      setEditingPos({ x: screenX + 20, y: screenY - 24 });
    },
    [nodes, stageScale, stageX, stageY]
  );

  const handleLinkDblClick = useCallback(
    (linkId: string) => {
      const link = links.get(linkId);
      if (!link) return;
      const fromNode = nodes.get(link.fromNodeId);
      const toNode = nodes.get(link.toNodeId);
      if (!fromNode || !toNode) return;
      const midX = (fromNode.x + toNode.x) / 2;
      const midY = (fromNode.y + toNode.y) / 2;
      const screenX = midX * stageScale + stageX;
      const screenY = midY * stageScale + stageY;
      setEditingId(linkId);
      setEditingValue(link.label);
      setEditingPos({ x: screenX + 8, y: screenY - 24 });
    },
    [links, nodes, stageScale, stageX, stageY]
  );

  // Double-click to edit frame label
  const handleFrameDblClick = useCallback(
    (solideId: string) => {
      const solide = solides.get(solideId);
      if (!solide || !solide.showFrame) return;
      const screenX = (solide.frameX ?? 0) * stageScale + stageX;
      const screenY = (solide.frameY ?? 0) * stageScale + stageY;
      setEditingId(`frame-${solideId}`);
      setEditingValue(solide.frameLabel ?? '');
      setEditingPos({ x: screenX + 20, y: screenY + 20 });
    },
    [solides, stageScale, stageX, stageY]
  );

  // Double-click to edit angle arc label
  const handleArcDblClick = useCallback(
    (arcId: string) => {
      const arc = angleArcs.get(arcId);
      if (!arc) return;
      const screenX = arc.x * stageScale + stageX;
      const screenY = arc.y * stageScale + stageY;
      setEditingId(arcId);
      setEditingValue(arc.label);
      setEditingPos({ x: screenX + 20, y: screenY - 24 });
    },
    [angleArcs, stageScale, stageX, stageY]
  );

  const commitEdit = useCallback(() => {
    if (!editingId) return;
    if (editingId.startsWith('frame-')) {
      const solideId = editingId.replace('frame-', '');
      updateSolideFrameLabel(solideId, editingValue);
    } else if (nodes.has(editingId)) {
      updateNodeLabel(editingId, editingValue);
    } else if (links.has(editingId)) {
      updateLinkLabel(editingId, editingValue);
    } else if (angleArcs.has(editingId)) {
      updateAngleArcLabel(editingId, editingValue);
    }
    setEditingId(null);
  }, [editingId, editingValue, nodes, links, angleArcs, updateNodeLabel, updateLinkLabel, updateSolideFrameLabel, updateAngleArcLabel]);

  // Drag move: update store in real-time (pause undo tracking) + snap + group drag
  const handleDragMove = useCallback(
    (nodeId: string, x: number, y: number) => {
      useDiagramStore.temporal.getState().pause();
      const snappedX = snap(x);
      const snappedY = snap(y);

      const state = useDiagramStore.getState();
      if (state.selectedIds.size > 1 && state.selectedIds.has(nodeId)) {
        const node = state.nodes.get(nodeId);
        if (!node) return;
        const dx = snappedX - node.x;
        const dy = snappedY - node.y;
        if (dx === 0 && dy === 0) return;

        const moves: Array<{ id: string; x: number; y: number }> = [];
        for (const id of state.selectedIds) {
          const n = state.nodes.get(id);
          if (n) {
            moves.push({ id, x: id === nodeId ? snappedX : n.x + dx, y: id === nodeId ? snappedY : n.y + dy });
          }
        }
        moveNodes(moves);
      } else {
        moveNode(nodeId, snappedX, snappedY);
      }
    },
    [moveNode, moveNodes]
  );

  // Drag end: resume undo tracking and commit final snapped position + group drag
  const handleDragEnd = useCallback(
    (nodeId: string, x: number, y: number) => {
      useDiagramStore.temporal.getState().resume();
      const snappedX = snap(x);
      const snappedY = snap(y);

      const state = useDiagramStore.getState();
      if (state.selectedIds.size > 1 && state.selectedIds.has(nodeId)) {
        const node = state.nodes.get(nodeId);
        if (!node) return;
        const dx = snappedX - node.x;
        const dy = snappedY - node.y;

        const moves: Array<{ id: string; x: number; y: number }> = [];
        for (const id of state.selectedIds) {
          const n = state.nodes.get(id);
          if (n) {
            moves.push({ id, x: id === nodeId ? snappedX : n.x + dx, y: id === nodeId ? snappedY : n.y + dy });
          }
        }
        moveNodes(moves);
      } else {
        moveNode(nodeId, snappedX, snappedY);
      }
    },
    [moveNode, moveNodes]
  );

  // Drag & drop from toolbar
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);

      const raw = e.dataTransfer.getData('application/kinesketch-liaison');
      if (!raw) return;

      let liaisonType: LiaisonType;
      let view: 1 | 2 = 1;
      try {
        const parsed = JSON.parse(raw);
        liaisonType = parsed.type;
        view = parsed.view ?? 1;
      } catch {
        liaisonType = raw as LiaisonType;
      }

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const x = snap((e.clientX - rect.left - stageX) / stageScale);
      const y = snap((e.clientY - rect.top - stageY) / stageScale);

      addNode(liaisonType, x, y, view);
    },
    [stageX, stageY, stageScale, addNode]
  );

  // Mouse move: ghost link, selection rect, panning, rotation
  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const stage = stageRef.current;
      if (!stage) return;

      // Panning (Space+drag or middle mouse)
      if (isPanning.current) {
        const dx = e.evt.clientX - panStart.current.x;
        const dy = e.evt.clientY - panStart.current.y;
        panStart.current = { x: e.evt.clientX, y: e.evt.clientY };
        setStagePosition(stageX + dx, stageY + dy);
        return;
      }

      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const worldX = (pointer.x - stageX) / stageScale;
      const worldY = (pointer.y - stageY) / stageScale;

      // Rotation mode
      if (isRotating.current && rotatingNodeId.current) {
        const node = useDiagramStore.getState().nodes.get(rotatingNodeId.current);
        if (node) {
          const dx = worldX - node.x;
          const dy = worldY - node.y;
          const angle = Math.atan2(dx, -dy) * 180 / Math.PI;
          const snapped = Math.round(angle / 15) * 15;
          rotateNode(rotatingNodeId.current, ((snapped % 360) + 360) % 360);
        }
        return;
      }

      if (activeTool === 'link') {
        // Find nearest node for hover/snap (exclude source when linking)
        let nearest: { id: string; x: number; y: number; dist: number } | null = null;
        for (const node of useDiagramStore.getState().nodes.values()) {
          if (linkSourceId && node.id === linkSourceId) continue;
          const dx = worldX - node.x;
          const dy = worldY - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_SNAP_RADIUS && (!nearest || dist < nearest.dist)) {
            nearest = { id: node.id, x: node.x, y: node.y, dist };
          }
        }

        if (linkSourceId) {
          if (nearest) {
            // Snap to nearest anchor on target node (not center)
            const targetNode = useDiagramStore.getState().nodes.get(nearest.id);
            const anchors = targetNode ? getAnchors(targetNode.type, targetNode.view) : [];
            if (targetNode && anchors.length > 0) {
              let bestIdx = 0;
              let bestDist = Infinity;
              let bestPos = { x: nearest.x, y: nearest.y };
              for (let i = 0; i < anchors.length; i++) {
                const world = anchorToWorld(anchors[i], targetNode.x, targetNode.y, targetNode.rotation);
                const dx = worldX - world.x;
                const dy = worldY - world.y;
                const dist = dx * dx + dy * dy;
                if (dist < bestDist) {
                  bestDist = dist;
                  bestPos = world;
                  bestIdx = i;
                }
              }
              setMousePos(bestPos);
              setLinkTargetAnchorIdx(bestIdx);
            } else {
              setMousePos({ x: nearest.x, y: nearest.y });
              setLinkTargetAnchorIdx(undefined);
            }
            setLinkSnapTarget(nearest.id);
          } else {
            setMousePos({ x: worldX, y: worldY });
            setLinkSnapTarget(null);
            setLinkTargetAnchorIdx(undefined);
          }
        }
        setLinkHoverNodeId(nearest?.id || null);
      } else {
        setLinkHoverNodeId(null);
      }

      if (isSelecting.current && selectionRect) {
        setSelectionRect({ ...selectionRect, x2: worldX, y2: worldY });
      }
    },
    [activeTool, linkSourceId, stageX, stageY, stageScale, selectionRect, setStagePosition, rotateNode]
  );

  // Mouse down: panning or selection rect
  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Middle mouse button, Space+left, or Move tool left click = pan
      if (e.evt.button === 1 || (spacePressed.current && e.evt.button === 0) || (activeTool === 'move' && e.evt.button === 0)) {
        isPanning.current = true;
        panStart.current = { x: e.evt.clientX, y: e.evt.clientY };
        setCursorMode('grabbing');
        return;
      }

      // Selection rect only on left click on empty canvas in select mode
      if (activeTool !== 'select') return;
      if (e.target !== e.target.getStage()) return;
      if (e.evt.button !== 0) return;

      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const worldX = (pointer.x - stageX) / stageScale;
      const worldY = (pointer.y - stageY) / stageScale;

      isSelecting.current = true;
      setSelectionRect({ x1: worldX, y1: worldY, x2: worldX, y2: worldY });
    },
    [activeTool, stageX, stageY, stageScale]
  );

  // Mouse up: end panning, rotation, or selection
  const handleStageMouseUp = useCallback(
    () => {
      // End panning
      if (isPanning.current) {
        isPanning.current = false;
        setCursorMode(spacePressed.current ? 'grab' : 'default');
        return;
      }

      // End rotation
      if (isRotating.current) {
        isRotating.current = false;
        rotatingNodeId.current = null;
        return;
      }

      // End selection rect
      if (!isSelecting.current || !selectionRect) {
        isSelecting.current = false;
        return;
      }

      isSelecting.current = false;
      const { x1, y1, x2, y2 } = selectionRect;
      const minX = Math.min(x1, x2);
      const maxX = Math.max(x1, x2);
      const minY = Math.min(y1, y2);
      const maxY = Math.max(y1, y2);

      // Only select if rect is meaningful (> 5px in world coords)
      if (maxX - minX < 5 && maxY - minY < 5) {
        setSelectionRect(null);
        return;
      }

      const ids: string[] = [];
      for (const node of nodes.values()) {
        if (node.x >= minX && node.x <= maxX && node.y >= minY && node.y <= maxY) {
          ids.push(node.id);
        }
      }

      if (ids.length > 0) {
        selectMultiple(ids);
        didSelect.current = true;
      }

      setSelectionRect(null);
    },
    [selectionRect, nodes, selectMultiple]
  );

  // Start rotation from handle
  const handleRotationStart = useCallback(
    (nodeId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      isRotating.current = true;
      rotatingNodeId.current = nodeId;
    },
    []
  );

  // Expose stageRef globally for export
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__kineSketchStage = stageRef;
  }, []);

  // Grid lines
  const gridLines = (() => {
    const lines: React.ReactNode[] = [];
    const pad = GRID_SIZE * 2;
    const startX = Math.floor((-stageX / stageScale) / GRID_SIZE) * GRID_SIZE - pad;
    const endX = Math.ceil((-stageX / stageScale + size.width / stageScale) / GRID_SIZE) * GRID_SIZE + pad;
    const startY = Math.floor((-stageY / stageScale) / GRID_SIZE) * GRID_SIZE - pad;
    const endY = Math.ceil((-stageY / stageScale + size.height / stageScale) / GRID_SIZE) * GRID_SIZE + pad;

    for (let x = startX; x <= endX; x += GRID_SIZE) {
      lines.push(
        <Line
          key={`gv${x}`}
          points={[x, startY, x, endY]}
          stroke="#e5e7eb"
          strokeWidth={0.5 / stageScale}
          listening={false}
        />
      );
    }
    for (let y = startY; y <= endY; y += GRID_SIZE) {
      lines.push(
        <Line
          key={`gh${y}`}
          points={[startX, y, endX, y]}
          stroke="#e5e7eb"
          strokeWidth={0.5 / stageScale}
          listening={false}
        />
      );
    }
    return lines;
  })();

  // Cursor logic
  const cursor =
    cursorMode === 'grabbing'
      ? 'grabbing'
      : cursorMode === 'grab'
        ? 'grab'
        : activeTool === 'move'
          ? 'grab'
          : activeTool === 'place'
            ? 'crosshair'
            : activeTool === 'link'
              ? 'pointer'
              : activeTool === 'select'
                ? 'crosshair'
                : 'default';

  // Find single selected node for rotation handle
  const singleSelectedNode = selectedIds.size === 1
    ? nodes.get(Array.from(selectedIds)[0])
    : undefined;

  return (
    <div
      ref={containerRef}
      style={{
        cursor,
        flex: 1,
        minWidth: 0,
        overflow: 'hidden',
        outline: dragOver ? '2px dashed #2563eb' : 'none',
        outlineOffset: '-2px',
        position: 'relative',
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        x={stageX}
        y={stageY}
        scaleX={stageScale}
        scaleY={stageScale}
        onWheel={handleWheel}
        onMouseMove={handleMouseMove}
        onClick={handleStageClick}
        onTap={handleStageClick as unknown as (evt: Konva.KonvaEventObject<TouchEvent>) => void}
        onMouseDown={handleStageMouseDown}
        onMouseUp={handleStageMouseUp}
      >
        <Layer listening={false} name="grid-layer">
          {gridLines}
        </Layer>
        <Layer>
          {/* Links (rendered below nodes) */}
          {Array.from(links.values()).map((link) => {
            const fromNode = nodes.get(link.fromNodeId);
            const toNode = nodes.get(link.toNodeId);
            if (!fromNode || !toNode) return null;
            return (
              <LinkRenderer
                key={link.id}
                link={link}
                fromNode={fromNode}
                toNode={toNode}
                fromSolideMapping={nodeSolideMapping.get(link.fromNodeId) || { a: null, b: null }}
                toSolideMapping={nodeSolideMapping.get(link.toNodeId) || { a: null, b: null }}
                selected={selectedIds.has(link.id)}
                onSelect={() => select(link.id)}
                onDblClick={() => handleLinkDblClick(link.id)}
                onLabelDragEnd={(ox, oy) => updateLinkLabelOffset(link.id, ox, oy)}
              />
            );
          })}

          {/* Local reference frames (rendered between links and nodes) */}
          {Array.from(solides.values()).map((solide) => {
            if (!solide.showFrame) return null;
            const frameId = `frame-${solide.id}`;
            return (
              <LocalFrameRenderer
                key={frameId}
                solide={solide}
                selected={selectedIds.has(frameId)}
                onSelect={() => select(frameId)}
                onDragMove={(x, y) => {
                  useDiagramStore.temporal.getState().pause();
                  moveSolideFrame(solide.id, x, y);
                }}
                onDragEnd={(x, y) => {
                  useDiagramStore.temporal.getState().resume();
                  moveSolideFrame(solide.id, x, y);
                }}
                onDblClick={() => handleFrameDblClick(solide.id)}
              />
            );
          })}

          {/* Angle arcs */}
          {Array.from(angleArcs.values()).map((arc) => {
            const fromSolide = solides.get(arc.fromSolideId);
            const toSolide = solides.get(arc.toSolideId);
            if (!fromSolide || !toSolide) return null;
            return (
              <AngleArcRenderer
                key={arc.id}
                arc={arc}
                fromSolide={fromSolide}
                toSolide={toSolide}
                selected={selectedIds.has(arc.id)}
                onSelect={() => select(arc.id)}
                onDragMove={(x, y) => {
                  useDiagramStore.temporal.getState().pause();
                  moveAngleArc(arc.id, x, y);
                }}
                onDragEnd={(x, y) => {
                  useDiagramStore.temporal.getState().resume();
                  moveAngleArc(arc.id, x, y);
                }}
                onDblClick={() => handleArcDblClick(arc.id)}
                onLabelDragEnd={(ox, oy) => updateAngleArcLabelOffset(arc.id, ox, oy)}
              />
            );
          })}

          {/* Ghost link line (follows mouse when linking) */}
          {linkSourceId && mousePos && (() => {
            const sourceNode = nodes.get(linkSourceId);
            if (!sourceNode) return null;
            const activeSolideId = useDiagramStore.getState().activeSolideId;
            const sourceMapping = nodeSolideMapping.get(linkSourceId) || { a: null, b: null };
            const fromAnchor = getBestAnchor(sourceNode, mousePos, activeSolideId, sourceMapping, linkSourceAnchorIdx);
            return (
              <Group listening={false}>
                <Line
                  points={[fromAnchor.x, fromAnchor.y, mousePos.x, mousePos.y]}
                  stroke="#2563eb"
                  strokeWidth={2}
                  dash={[8, 4]}
                  opacity={0.6}
                />
              </Group>
            );
          })()}

          {/* Selection rectangle */}
          {selectionRect && (() => {
            const x = Math.min(selectionRect.x1, selectionRect.x2);
            const y = Math.min(selectionRect.y1, selectionRect.y2);
            const w = Math.abs(selectionRect.x2 - selectionRect.x1);
            const h = Math.abs(selectionRect.y2 - selectionRect.y1);
            return (
              <Rect
                x={x}
                y={y}
                width={w}
                height={h}
                fill="rgba(37, 99, 235, 0.08)"
                stroke="#2563eb"
                strokeWidth={1 / stageScale}
                dash={[6 / stageScale, 3 / stageScale]}
                listening={false}
              />
            );
          })()}

          {/* Nodes */}
          {Array.from(nodes.values()).map((node) => (
            <ShapeRenderer
              key={node.id}
              node={node}
              selected={selectedIds.has(node.id)}
              isBati={batiNodeIds.has(node.id)}
              colors={nodeColors.get(node.id) || ['#1a1a1a', '#1a1a1a']}
              onSelect={() => handleNodeClick(node.id)}
              onDblClick={() => handleNodeDblClick(node.id)}
              onDragMove={(x, y) => handleDragMove(node.id, x, y)}
              onDragEnd={(x, y) => handleDragEnd(node.id, x, y)}
              onLabelDragEnd={(ox, oy) => updateNodeLabelOffset(node.id, ox, oy)}
            />
          ))}

          {/* Anchor point indicators in link mode — rendered AFTER nodes so they're on top */}
          {activeTool === 'link' && linkHoverNodeId && (() => {
            const hoverNode = nodes.get(linkHoverNodeId);
            if (!hoverNode) return null;
            const anchors = getAnchors(hoverNode.type, hoverNode.view);
            const isTarget = linkSourceId && linkHoverNodeId === linkSnapTarget;
            return anchors.map((anchor, i) => {
              const world = anchorToWorld(anchor, hoverNode.x, hoverNode.y, hoverNode.rotation);
              const isSnapped = isTarget && linkTargetAnchorIdx === i;
              return (
                <Circle
                  key={`anchor-hover-${i}`}
                  x={world.x}
                  y={world.y}
                  radius={isSnapped ? 4 : 3}
                  fill={isSnapped ? 'rgba(37, 99, 235, 0.3)' : 'rgba(120, 120, 120, 0.25)'}
                  stroke={isSnapped ? '#2563eb' : 'rgba(100, 100, 100, 0.5)'}
                  strokeWidth={isSnapped ? 1.5 : 1}
                  onClick={(e) => { e.cancelBubble = true; handleAnchorClick(linkHoverNodeId, i); }}
                  onTap={(e) => { e.cancelBubble = true; handleAnchorClick(linkHoverNodeId, i); }}
                />
              );
            });
          })()}

          {/* Selection indicators — dashed rect around each selected node */}
          {Array.from(selectedIds).map((id) => {
            const node = nodes.get(id);
            if (!node) return null;
            return (
              <Group key={`sel-${id}`} x={node.x} y={node.y} rotation={node.rotation} listening={false}>
                <Rect
                  x={-SELECTION_PAD}
                  y={-SELECTION_PAD}
                  width={SELECTION_PAD * 2}
                  height={SELECTION_PAD * 2}
                  stroke="#2563eb"
                  strokeWidth={1.2 / stageScale}
                  dash={[5 / stageScale, 3 / stageScale]}
                  cornerRadius={3 / stageScale}
                />
              </Group>
            );
          })}

          {/* Rotation handle — only for single selected node */}
          {singleSelectedNode && (() => {
            const node = singleSelectedNode;
            const rad = node.rotation * Math.PI / 180;
            const hx = node.x + ROTATION_HANDLE_DIST * Math.sin(rad);
            const hy = node.y - ROTATION_HANDLE_DIST * Math.cos(rad);
            const edgeX = node.x + SELECTION_PAD * Math.sin(rad);
            const edgeY = node.y - SELECTION_PAD * Math.cos(rad);
            return (
              <Group>
                <Line
                  points={[edgeX, edgeY, hx, hy]}
                  stroke="#2563eb"
                  strokeWidth={1 / stageScale}
                  listening={false}
                />
                <Circle
                  x={hx}
                  y={hy}
                  radius={7 / stageScale}
                  fill="white"
                  stroke="#2563eb"
                  strokeWidth={1.5 / stageScale}
                  onMouseDown={(e) => handleRotationStart(node.id, e)}
                />
                {/* Rotation arrow icon */}
                <Line
                  points={[
                    hx + 4 / stageScale * Math.cos(rad),
                    hy + 4 / stageScale * Math.sin(rad),
                    hx,
                    hy - 5 / stageScale,
                    hx - 4 / stageScale * Math.cos(rad),
                    hy - 4 / stageScale * Math.sin(rad),
                  ]}
                  stroke="#2563eb"
                  strokeWidth={1 / stageScale}
                  listening={false}
                />
              </Group>
            );
          })()}
        </Layer>
        <Layer listening={false} name="axis-layer">
          <AxisWidget
            x={(60 - stageX) / stageScale}
            y={(size.height - 60 - stageY) / stageScale}
            scale={stageScale}
          />
        </Layer>
      </Stage>

      {/* Empty state */}
      {nodes.size === 0 && !placingLiaison && (
        <div className="canvas-empty-state">
          <div className="canvas-empty-icon">⊹</div>
          <div className="canvas-empty-title">Canvas vide</div>
          <div className="canvas-empty-hint">
            Glissez une liaison depuis la barre d'outils<br />
            ou appuyez sur <kbd>1</kbd>-<kbd>9</kbd> puis cliquez
          </div>
        </div>
      )}

      {/* Inline label editor */}
      {editingId && (
        <input
          ref={inputRef}
          className="canvas-label-input"
          style={{
            position: 'absolute',
            left: editingPos.x,
            top: editingPos.y,
          }}
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commitEdit();
            if (e.key === 'Escape') setEditingId(null);
          }}
        />
      )}
    </div>
  );
}
