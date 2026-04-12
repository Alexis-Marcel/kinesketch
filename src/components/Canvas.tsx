'use client';

import { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { Stage, Layer } from 'react-konva';
import type Konva from 'konva';
import { useDiagramStore, pauseHistory, resumeHistory } from '../store/diagramStore';
import { ShapeRenderer } from './ShapeRenderer';
import { LinkRenderer } from './LinkRenderer';
import { LocalFrameRenderer } from './LocalFrameRenderer';
import { AngleArcRenderer } from './AngleArcRenderer';
import { AxisWidget } from './AxisWidget';
import { GridLayer } from './GridLayer';
import {
  HoverAnchorMarkers,
  LinkGhostLine,
  ReanchorGhostLine,
  SelectedLinkAnchors,
  SelectionOutline,
  SelectionRect,
  SnapPointDot,
  TransformHandles,
} from './CanvasOverlays';
import type { AnchorOffset, LiaisonType } from '../types';
import { snap, CELL } from '../utils/snap';
import { pointerToWorld } from '../utils/stage';
import { buildLinkPath, projectOntoPolyline } from '../utils/linkPath';
import { findNearestNode, getAnchors, pickNearestAnchor, type SolideMapping } from '../utils/anchors';
import { getLiaisonBounds } from '../liaisons/bounds';

const MIN_SCALE = 0.1;
const MAX_SCALE = 5;
const LINK_SNAP_RADIUS = 45; // px in world coords — snap ghost line to nearby nodes

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
  /** Anchor pinned on the link's source side once the user clicks the first node. */
  const [linkSourceAnchor, setLinkSourceAnchor] = useState<{ idx: number; offset?: AnchorOffset } | null>(null);
  /** Anchor under the cursor on the snap target — updated by the hover handler. */
  const [linkTargetAnchor, setLinkTargetAnchor] = useState<{ idx: number; offset?: AnchorOffset } | null>(null);
  /** World position of the live snap point on a shape anchor (where a click would attach). */
  const [snapPointPos, setSnapPointPos] = useState<{ x: number; y: number } | null>(null);
  const [reanchoring, setReanchoring] = useState<{ linkId: string; end: 'from' | 'to' } | null>(null);
  /** When snapping to a link line (for T-junction creation), tracks which link and t parameter. */
  const [linkLineSnap, setLinkLineSnap] = useState<{ linkId: string; t: number; pos: { x: number; y: number } } | null>(null);
  const isSelecting = useRef(false);
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const spacePressed = useRef(false);
  const isRotating = useRef(false);
  const rotatingNodeId = useRef<string | null>(null);
  const isScaling = useRef(false);
  const scalingNodeId = useRef<string | null>(null);
  const scalingStart = useRef<{ dist: number; scale: number }>({ dist: 0, scale: 1 });
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
  const scaleNode = useDiagramStore((s) => s.scaleNode);
  const select = useDiagramStore((s) => s.select);
  const selectMultiple = useDiagramStore((s) => s.selectMultiple);
  const clearSelection = useDiagramStore((s) => s.clearSelection);
  const setStagePosition = useDiagramStore((s) => s.setStagePosition);
  const setStageScale = useDiagramStore((s) => s.setStageScale);
  const addLink = useDiagramStore((s) => s.addLink);
  const addLinkToLink = useDiagramStore((s) => s.addLinkToLink);
  const reanchorLink = useDiagramStore((s) => s.reanchorLink);
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

  // (bâti detection removed — bâti is now a standalone node type)

  // Per-node solide assignment + colors. Each node gets one solide per anchor
  // side (A and B); the resolved colors and the raw solide IDs are produced in
  // a single pass so the two derived maps stay in sync.
  const { nodeColors, nodeSolideMapping } = useMemo(() => {
    const colors = new Map<string, [string, string]>();
    const mapping = new Map<string, SolideMapping>();
    for (const node of nodes.values()) {
      let sideA: string | null = null;
      let sideB: string | null = null;
      const anchors = getAnchors(node.type, node.view);

      for (const link of links.values()) {
        let anchorIdx: number | undefined;
        if (link.fromNodeId === node.id) anchorIdx = link.fromAnchorIdx;
        else if (link.toNodeId === node.id) anchorIdx = link.toAnchorIdx;
        else continue;

        if (anchorIdx !== undefined && anchorIdx < anchors.length) {
          const side = anchors[anchorIdx].side;
          if (side === 'A' && !sideA) sideA = link.solideId;
          else if (side === 'B' && !sideB) sideB = link.solideId;
        } else {
          if (!sideA) sideA = link.solideId;
          else if (!sideB) sideB = link.solideId;
        }
      }

      const cA = sideA ? (solides.get(sideA)?.color ?? '#1a1a1a') : '#1a1a1a';
      const cB = sideB ? (solides.get(sideB)?.color ?? '#1a1a1a') : '#1a1a1a';
      colors.set(node.id, [cA, cB]);
      mapping.set(node.id, { a: sideA, b: sideB });
    }
    return { nodeColors: colors, nodeSolideMapping: mapping };
  }, [nodes, links, solides]);

  /**
   * Classify nodes and links into render passes based on per-anchor `behind` flags.
   *
   * Render order:
   *   1. normalNodes      — nodes with no incoming behind-link
   *   2. behindLinks      — links that touch at least one behind anchor
   *   3. behindNodes      — nodes that have a link connecting to one of their behind anchors
   *                         (rendered ON TOP of behindLinks to mask them)
   *   4. frontLinks       — all other links (rendered last, on top of all nodes)
   */
  const renderPasses = useMemo(() => {
    const behindNodeIds = new Set<string>();
    const behindLinkIds = new Set<string>();
    /**
     * Links that are mixed front/behind: full line is drawn in Pass 2 to be
     * masked at the behind end, then the OTHER half is drawn again in Pass 4
     * so the front end shows on top of its node. Maps linkId → which half
     * needs the front overlay ('from' if the FROM end is the front one).
     */
    const frontHalfOverlays = new Map<string, 'from' | 'to'>();

    for (const link of links.values()) {
      const fromNode = nodes.get(link.fromNodeId);
      const toNode = nodes.get(link.toNodeId);
      if (!fromNode || !toNode) continue;

      const fromAnchors = getAnchors(fromNode.type, fromNode.view);
      const toAnchors = getAnchors(toNode.type, toNode.view);

      const fromBehind =
        link.fromAnchorIdx !== undefined &&
        link.fromAnchorIdx < fromAnchors.length &&
        fromAnchors[link.fromAnchorIdx]?.behind === true;
      const toBehind =
        link.toAnchorIdx !== undefined &&
        link.toAnchorIdx < toAnchors.length &&
        toAnchors[link.toAnchorIdx]?.behind === true;

      if (fromBehind) behindNodeIds.add(link.fromNodeId);
      if (toBehind) behindNodeIds.add(link.toNodeId);
      if (fromBehind || toBehind) behindLinkIds.add(link.id);
      // Mixed: one end is front, the other behind. The front end needs an
      // overlay so it draws on top of the masking node from Pass 3.
      if (fromBehind && !toBehind) frontHalfOverlays.set(link.id, 'to');
      else if (!fromBehind && toBehind) frontHalfOverlays.set(link.id, 'from');
    }

    return { behindNodeIds, behindLinkIds, frontHalfOverlays };
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

        const mousePointTo = pointerToWorld(pointer, stageX, stageY, oldScale);

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

  // Clear all in-progress link state (source pin, ghost line, snap target).
  const resetLinkState = useCallback(() => {
    setLinkSource(null);
    setMousePos(null);
    setLinkSnapTarget(null);
    setLinkSourceAnchor(null);
    setLinkTargetAnchor(null);
  }, [setLinkSource]);

  // Start or complete a link at (nodeId, anchorIdx). Used by every click
  // surface in link mode (stage / node / anchor marker) so the start/complete
  // logic lives in one place.
  // Create a T-junction: link from source node to a point on an existing link.
  const commitTJunction = useCallback(
    (toLinkId: string, toLinkT: number) => {
      if (!linkSourceId) return;
      addLinkToLink(linkSourceId, toLinkId, toLinkT, linkSourceAnchor?.idx, linkSourceAnchor?.offset);
      resetLinkState();
      setLinkLineSnap(null);
    },
    [linkSourceId, linkSourceAnchor, addLinkToLink, resetLinkState]
  );

  const commitLinkAtAnchor = useCallback(
    (nodeId: string, anchorIdx: number, offset: AnchorOffset | undefined) => {
      if (!linkSourceId) {
        setLinkSource(nodeId);
        setLinkSourceAnchor({ idx: anchorIdx, offset });
        return;
      }
      if (linkSourceId === nodeId) return;
      addLink(linkSourceId, nodeId, linkSourceAnchor?.idx, anchorIdx, linkSourceAnchor?.offset, offset);
      resetLinkState();
    },
    [linkSourceId, linkSourceAnchor, addLink, setLinkSource, resetLinkState]
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

      const { x, y } = pointerToWorld(pointer, stageX, stageY, stageScale);

      if (activeTool === 'place' && placingLiaison) {
        addNode(placingLiaison.type, snap(x / CELL), snap(y / CELL), placingLiaison.view);
        return;
      }
      if (activeTool === 'link') {
        // The snap radius extends past every node bbox, so an anchor may
        // already be tracked even when the click hits empty stage. Treat the
        // click as if it had landed on the snapped node; otherwise exit.
        if (linkSnapTarget && linkTargetAnchor) {
          commitLinkAtAnchor(linkSnapTarget, linkTargetAnchor.idx, linkTargetAnchor.offset);
          return;
        }
        // T-junction: if snapped to a link line, create a link-to-link connection
        if (linkSourceId && linkLineSnap) {
          addLinkToLink(linkSourceId, linkLineSnap.linkId, linkLineSnap.t, linkSourceAnchor?.idx, linkSourceAnchor?.offset);
          resetLinkState();
          setLinkLineSnap(null);
          return;
        }
        resetLinkState();
        setTool('select');
        return;
      }
      clearSelection();
    },
    [activeTool, placingLiaison, stageX, stageY, stageScale, addNode, clearSelection, setTool, linkSnapTarget, linkTargetAnchor, commitLinkAtAnchor, resetLinkState, linkSourceId, linkLineSnap, linkSourceAnchor, addLinkToLink]
  );

  // Click on a node body. In link mode, the hover handler has already aligned
  // the tracked snap with the cursor, so we just consume it.
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      if (activeTool !== 'link') {
        select(nodeId);
        return;
      }
      if (linkSnapTarget === nodeId && linkTargetAnchor) {
        commitLinkAtAnchor(nodeId, linkTargetAnchor.idx, linkTargetAnchor.offset);
      }
    },
    [activeTool, linkSnapTarget, linkTargetAnchor, commitLinkAtAnchor, select]
  );

  // Click on a link line with the world position — compute t and create T-junction.
  const handleLinkLineClick = useCallback(
    (clickedLinkId: string, worldPos: { x: number; y: number }) => {
      if (activeTool === 'link' && linkSourceId) {
        const storeState = useDiagramStore.getState();
        const clickedLink = storeState.links.get(clickedLinkId);
        if (clickedLink) {
          const path = buildLinkPath(clickedLink, storeState.nodes);
          if (path.length >= 2) {
            const proj = projectOntoPolyline(path, worldPos);
            commitTJunction(clickedLinkId, proj.t);
            return;
          }
        }
        commitTJunction(clickedLinkId, 0.5);
        return;
      }
      select(clickedLinkId);
    },
    [activeTool, linkSourceId, commitTJunction, select]
  );

  // Click directly on an anchor marker. Use the explicit index but reuse the
  // hover-captured offset when it matches (so circle anchors keep their angle).
  const handleAnchorClick = useCallback(
    (nodeId: string, anchorIdx: number) => {
      if (activeTool !== 'link') return;
      const offset = linkTargetAnchor?.idx === anchorIdx ? linkTargetAnchor.offset : undefined;
      commitLinkAtAnchor(nodeId, anchorIdx, offset);
    },
    [activeTool, linkTargetAnchor, commitLinkAtAnchor]
  );

  // Double-click to edit label
  const handleNodeDblClick = useCallback(
    (nodeId: string) => {
      const node = nodes.get(nodeId);
      if (!node) return;
      const screenX = node.x * CELL * stageScale + stageX;
      const screenY = node.y * CELL * stageScale + stageY;
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
      const screenX = midX * CELL * stageScale + stageX;
      const screenY = midY * CELL * stageScale + stageY;
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
      pauseHistory();
      const snappedX = snap(x);
      const snappedY = snap(y);

      const state = useDiagramStore.getState();
      if (!state.selectedIds.has(nodeId)) {
        state.select(nodeId);
      }
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
      resumeHistory();
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
      const x = snap((e.clientX - rect.left - stageX) / stageScale / CELL);
      const y = snap((e.clientY - rect.top - stageY) / stageScale / CELL);

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

      const { x: worldX, y: worldY } = pointerToWorld(pointer, stageX, stageY, stageScale);

      // Rotation mode
      if (isRotating.current && rotatingNodeId.current) {
        const node = useDiagramStore.getState().nodes.get(rotatingNodeId.current);
        if (node) {
          const dx = worldX - node.x * CELL;
          const dy = worldY - node.y * CELL;
          const angle = Math.atan2(dx, -dy) * 180 / Math.PI;
          const snapped = Math.round(angle / 15) * 15;
          rotateNode(rotatingNodeId.current, ((snapped % 360) + 360) % 360);
        }
        return;
      }

      // Scale mode
      if (isScaling.current && scalingNodeId.current) {
        const node = useDiagramStore.getState().nodes.get(scalingNodeId.current);
        if (node) {
          const dx = worldX - node.x * CELL;
          const dy = worldY - node.y * CELL;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const ratio = dist / scalingStart.current.dist;
          const newScale = Math.max(0.3, Math.min(4, scalingStart.current.scale * ratio));
          // Snap to 0.1 increments
          const snapped = Math.round(newScale * 10) / 10;
          scaleNode(scalingNodeId.current, snapped);
        }
        return;
      }

      if (activeTool === 'link' || reanchoring) {
        // The detection radius is the node's bounding-box half-diagonal plus
        // LINK_SNAP_RADIUS so hovering near the perimeter of a large shape
        // (e.g. an engrenage circle) already triggers the anchor preview.
        const storeState = useDiagramStore.getState();
        const excludeNodeId = reanchoring
          ? (reanchoring.end === 'from'
            ? storeState.links.get(reanchoring.linkId)?.toNodeId
            : storeState.links.get(reanchoring.linkId)?.fromNodeId)
          : linkSourceId;
        const nearest = findNearestNode(
          storeState.nodes,
          { x: worldX, y: worldY },
          LINK_SNAP_RADIUS,
          excludeNodeId,
          getLiaisonBounds
        );

        // Also check proximity to link lines (for T-junction). Runs
        // alongside node detection — the link line wins if the cursor is
        // very close to it (< LINK_LINE_SNAP_DIST).
        // Check proximity to link lines using RESOLVED anchor positions
        // (not node centers) so the snap zone matches the visible link.
        const LINK_LINE_SNAP_DIST = 15;
        let bestLinkSnap: { linkId: string; t: number; pos: { x: number; y: number }; dist: number } | null = null;
        if (linkSourceId && !reanchoring) {
          for (const lk of storeState.links.values()) {
            const path = buildLinkPath(lk, storeState.nodes);
            if (path.length < 2) continue;
            const proj = projectOntoPolyline(path, { x: worldX, y: worldY });
            if (proj.dist < LINK_LINE_SNAP_DIST && (!bestLinkSnap || proj.dist < bestLinkSnap.dist)) {
              bestLinkSnap = { linkId: lk.id, t: proj.t, pos: proj.pos, dist: proj.dist };
            }
          }
        }

        // Decide: link line snap wins if very close, otherwise node snap wins
        const useLinkSnap = bestLinkSnap && (!nearest || bestLinkSnap.dist < 10);

        if (useLinkSnap && bestLinkSnap) {
          // Snap to link line (T-junction preview)
          if (linkSourceId) setMousePos(bestLinkSnap.pos);
          setSnapPointPos(bestLinkSnap.pos);
          setLinkLineSnap({ linkId: bestLinkSnap.linkId, t: bestLinkSnap.t, pos: bestLinkSnap.pos });
          setLinkSnapTarget(null);
          setLinkTargetAnchor(null);
          setLinkHoverNodeId(null);
        } else if (nearest) {
          const picked = pickNearestAnchor(nearest.node, { x: worldX, y: worldY });
          const followCursor = linkSourceId || reanchoring;
          if (picked) {
            if (followCursor) setMousePos(picked.pos);
            setLinkTargetAnchor({ idx: picked.idx, offset: picked.offset });
            setSnapPointPos(picked.pos);
          } else {
            if (followCursor) setMousePos({ x: nearest.node.x * CELL, y: nearest.node.y * CELL });
            setLinkTargetAnchor(null);
            setSnapPointPos(null);
          }
          setLinkSnapTarget(nearest.node.id);
          setLinkHoverNodeId(nearest.node.id);
          setLinkLineSnap(null);
        } else {
          if (linkSourceId || reanchoring) setMousePos({ x: worldX, y: worldY });
          setLinkSnapTarget(null);
          setLinkTargetAnchor(null);
          setSnapPointPos(null);
          setLinkHoverNodeId(null);
          setLinkLineSnap(null);
        }
      } else {
        setLinkHoverNodeId(null);
      }

      if (isSelecting.current && selectionRect) {
        setSelectionRect({ ...selectionRect, x2: worldX, y2: worldY });
      }
    },
    [activeTool, linkSourceId, reanchoring, stageX, stageY, stageScale, selectionRect, setStagePosition, rotateNode]
  );

  // Mouse down: panning or selection rect
  const handleStageMouseDown = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      // Middle mouse button or Space+left = pan
      if (e.evt.button === 1 || (spacePressed.current && e.evt.button === 0)) {
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

      const { x: worldX, y: worldY } = pointerToWorld(pointer, stageX, stageY, stageScale);

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

      // End scaling
      if (isScaling.current) {
        isScaling.current = false;
        scalingNodeId.current = null;
        return;
      }

      // End rotation
      if (isRotating.current) {
        isRotating.current = false;
        rotatingNodeId.current = null;
        return;
      }

      // End re-anchoring (drag release)
      if (reanchoring) {
        if (linkSnapTarget && linkTargetAnchor) {
          reanchorLink(reanchoring.linkId, reanchoring.end, linkSnapTarget, linkTargetAnchor.idx, linkTargetAnchor.offset);
        }
        setReanchoring(null);
        setMousePos(null);
        setLinkSnapTarget(null);
        setLinkTargetAnchor(null);
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
        if (node.x * CELL >= minX && node.x * CELL <= maxX && node.y * CELL >= minY && node.y * CELL <= maxY) {
          ids.push(node.id);
        }
      }

      if (ids.length > 0) {
        selectMultiple(ids);
        didSelect.current = true;
      }

      setSelectionRect(null);
    },
    [selectionRect, reanchoring, linkSnapTarget, linkTargetAnchor, nodes, selectMultiple, reanchorLink]
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

  // Start scale from corner handle
  const handleScaleStart = useCallback(
    (nodeId: string, e: Konva.KonvaEventObject<MouseEvent>) => {
      e.cancelBubble = true;
      isScaling.current = true;
      scalingNodeId.current = nodeId;
      const node = useDiagramStore.getState().nodes.get(nodeId);
      if (!node) return;
      const stage = stageRef.current;
      if (!stage) return;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const { x: worldX, y: worldY } = pointerToWorld(pointer, stageX, stageY, stageScale);
      const dx = worldX - node.x * CELL;
      const dy = worldY - node.y * CELL;
      scalingStart.current = { dist: Math.sqrt(dx * dx + dy * dy), scale: node.scale ?? 1 };
    },
    [stageX, stageY, stageScale]
  );

  // Expose stageRef globally for export
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__kineSketchStage = stageRef;
  }, []);

  // Cursor logic
  const cursor =
    cursorMode === 'grabbing'
      ? 'grabbing'
      : cursorMode === 'grab'
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
        <GridLayer width={size.width} height={size.height} stageX={stageX} stageY={stageY} stageScale={stageScale} />
        <Layer>
          {/* Local reference frames */}
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
                  pauseHistory();
                  moveSolideFrame(solide.id, x, y);
                }}
                onDragEnd={(x, y) => {
                  resumeHistory();
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
                  pauseHistory();
                  moveAngleArc(arc.id, x, y);
                }}
                onDragEnd={(x, y) => {
                  resumeHistory();
                  moveAngleArc(arc.id, x, y);
                }}
                onDblClick={() => handleArcDblClick(arc.id)}
                onLabelDragEnd={(ox, oy) => updateAngleArcLabelOffset(arc.id, ox, oy)}
              />
            );
          })}

          {/* Pass 1: Normal nodes (no behind anchors used) — rendered below links */}
          {Array.from(nodes.values()).filter((n) => !renderPasses.behindNodeIds.has(n.id)).map((node) => (
            <ShapeRenderer
              key={node.id}
              node={node}
              selected={selectedIds.has(node.id)}
              colors={nodeColors.get(node.id) || ['#1a1a1a', '#1a1a1a']}
              onSelect={() => handleNodeClick(node.id)}
              onDblClick={() => handleNodeDblClick(node.id)}
              onDragMove={(x, y) => handleDragMove(node.id, x, y)}
              onDragEnd={(x, y) => handleDragEnd(node.id, x, y)}
              onLabelDragEnd={(ox, oy) => updateNodeLabelOffset(node.id, ox, oy)}
            />
          ))}

          {/* Pass 2: Behind links — links touching at least one "behind" anchor */}
          {Array.from(links.values()).filter((l) => renderPasses.behindLinkIds.has(l.id)).map((link) => {
            if (reanchoring && reanchoring.linkId === link.id) return null;
            const fromNode = nodes.get(link.fromNodeId);
            const toNode = nodes.get(link.toNodeId);
            // T-junction links may not have a toNode — that's OK
            if (!fromNode && !link.fromLinkId) return null;
            if (!toNode && !link.toLinkId) return null;
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
                onLinkLineClick={activeTool === 'link' && linkSourceId
                  ? (worldPos) => handleLinkLineClick(link.id, worldPos)
                  : undefined}
              />
            );
          })}

          {/* Pass 3: Behind-target nodes — rendered on top of behind links so they mask them */}
          {Array.from(nodes.values()).filter((n) => renderPasses.behindNodeIds.has(n.id)).map((node) => (
            <ShapeRenderer
              key={`behind-${node.id}`}
              node={node}
              selected={selectedIds.has(node.id)}
              colors={nodeColors.get(node.id) || ['#1a1a1a', '#1a1a1a']}
              onSelect={() => handleNodeClick(node.id)}
              onDblClick={() => handleNodeDblClick(node.id)}
              onDragMove={(x, y) => handleDragMove(node.id, x, y)}
              onDragEnd={(x, y) => handleDragEnd(node.id, x, y)}
              onLabelDragEnd={(ox, oy) => updateNodeLabelOffset(node.id, ox, oy)}
            />
          ))}

          {/* Pass 4: Front links — regular links rendered on top of all
              nodes, plus front-half overlays for mixed links so their front
              end shows on top of the Pass 3 masking node. */}
          {Array.from(links.values()).filter((l) => !renderPasses.behindLinkIds.has(l.id)).map((link) => {
            if (reanchoring && reanchoring.linkId === link.id) return null;
            const fromNode = nodes.get(link.fromNodeId);
            const toNode = nodes.get(link.toNodeId);
            if (!fromNode && !link.fromLinkId) return null;
            if (!toNode && !link.toLinkId) return null;
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
                onLinkLineClick={activeTool === 'link' && linkSourceId
                  ? (worldPos) => handleLinkLineClick(link.id, worldPos)
                  : undefined}
              />
            );
          })}
          {Array.from(renderPasses.frontHalfOverlays.entries()).map(([linkId, side]) => {
            if (reanchoring && reanchoring.linkId === linkId) return null;
            const link = links.get(linkId);
            if (!link) return null;
            const fromNode = nodes.get(link.fromNodeId);
            const toNode = nodes.get(link.toNodeId);
            if (!fromNode || !toNode) return null;
            return (
              <LinkRenderer
                key={`overlay-${linkId}`}
                link={link}
                fromNode={fromNode}
                toNode={toNode}
                fromSolideMapping={nodeSolideMapping.get(link.fromNodeId) || { a: null, b: null }}
                toSolideMapping={nodeSolideMapping.get(link.toNodeId) || { a: null, b: null }}
                selected={false}
                onSelect={() => undefined}
                onDblClick={() => undefined}
                onLabelDragEnd={() => undefined}
                halfMode={side}
                interactive={false}
              />
            );
          })}

          {/* Ghost link line (follows mouse when linking) */}
          {linkSourceId && mousePos && (() => {
            const sourceNode = nodes.get(linkSourceId);
            if (!sourceNode) return null;
            return (
              <LinkGhostLine
                sourceNode={sourceNode}
                mousePos={mousePos}
                activeSolideId={useDiagramStore.getState().activeSolideId}
                sourceMapping={nodeSolideMapping.get(linkSourceId) || { a: null, b: null }}
                sourceAnchorIdx={linkSourceAnchor?.idx}
                sourceAnchorOffset={linkSourceAnchor?.offset}
              />
            );
          })()}

          {/* Ghost line for re-anchoring — uses link's actual color, solid */}
          {reanchoring && mousePos && (() => {
            const link = links.get(reanchoring.linkId);
            if (!link) return null;
            return (
              <ReanchorGhostLine
                link={link}
                end={reanchoring.end}
                mousePos={mousePos}
                nodes={nodes}
                solides={solides}
                nodeSolideMapping={nodeSolideMapping}
              />
            );
          })()}

          {/* Anchor indicators during re-anchoring — show anchors on hovered node */}
          {reanchoring && linkHoverNodeId && (() => {
            const hoverNode = nodes.get(linkHoverNodeId);
            if (!hoverNode) return null;
            return (
              <HoverAnchorMarkers
                hoverNode={hoverNode}
                isTarget={linkSnapTarget === linkHoverNodeId}
                targetAnchorIdx={linkTargetAnchor?.idx}
              />
            );
          })()}

          {/* Selection rectangle */}
          {selectionRect && <SelectionRect rect={selectionRect} stageScale={stageScale} />}

          {/* Snap point indicator on shape anchors — small blue dot showing where
              the link will attach if the user clicks. Only drawn for non-point
              shapes since point anchors already show a dot at their center. */}
          {(activeTool === 'link' || reanchoring) && linkSnapTarget && linkTargetAnchor && snapPointPos && (() => {
            const targetNode = nodes.get(linkSnapTarget);
            if (!targetNode) return null;
            const targetAnchor = getAnchors(targetNode.type, targetNode.view)[linkTargetAnchor.idx];
            if (!targetAnchor?.shape || targetAnchor.shape.kind === 'point') return null;
            return <SnapPointDot pos={snapPointPos} />;
          })()}

          {/* Snap point on link line (T-junction preview) */}
          {activeTool === 'link' && linkLineSnap && <SnapPointDot pos={linkLineSnap.pos} />}

          {/* Anchor point indicators in link mode — rendered AFTER nodes so they're on top */}
          {activeTool === 'link' && linkHoverNodeId && (() => {
            const hoverNode = nodes.get(linkHoverNodeId);
            if (!hoverNode) return null;
            return (
              <HoverAnchorMarkers
                hoverNode={hoverNode}
                isTarget={linkHoverNodeId === linkSnapTarget}
                targetAnchorIdx={linkTargetAnchor?.idx}
                onAnchorClick={(i) => handleAnchorClick(linkHoverNodeId, i)}
              />
            );
          })()}

          {/* Anchor indicators for selected links — let the user grab any anchor to reanchor that end */}
          {!reanchoring && Array.from(selectedIds).flatMap((id) => {
            const link = links.get(id);
            if (!link) return [];
            const fromNode = nodes.get(link.fromNodeId);
            const toNode = nodes.get(link.toNodeId);
            if (!fromNode || !toNode) return [];
            return [
              <SelectedLinkAnchors
                key={`sel-${id}`}
                link={link}
                fromNode={fromNode}
                toNode={toNode}
                onStartReanchor={(linkId, end) => {
                  setReanchoring({ linkId, end });
                  setMousePos(null);
                  setLinkSnapTarget(null);
                  setLinkTargetAnchor(null);
                }}
              />,
            ];
          })}

          {/* Selection indicators — dashed rect around each selected node */}
          {Array.from(selectedIds).map((id) => {
            const node = nodes.get(id);
            if (!node) return null;
            return <SelectionOutline key={`sel-${id}`} node={node} stageScale={stageScale} />;
          })}

          {/* Transform handles (resize corners + rotation) for single selected node */}
          {singleSelectedNode && (
            <TransformHandles
              node={singleSelectedNode}
              stageScale={stageScale}
              onScaleStart={handleScaleStart}
              onRotateStart={handleRotationStart}
            />
          )}
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
            Glissez une liaison depuis la barre d&apos;outils<br />
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
