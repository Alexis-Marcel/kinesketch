import { create } from 'zustand';
import { temporal } from 'zundo';
import type { AnchorOffset, AngleArc, ArrowMarker, DiagramDimension, DiagramNode, DiagramState, LiaisonType, LiaisonView, Link, LinkLineStyle, LinkRoutingMode, Solide, ToolType } from '../types';

export const SOLIDE_COLORS = [
  '#6b7280', // S0 bâti — gris
  '#2563eb', // S1 — bleu
  '#dc2626', // S2 — rouge
  '#16a34a', // S3 — vert
  '#d97706', // S4 — orange
  '#9333ea', // S5 — violet
  '#0891b2', // S6 — cyan
  '#e11d48', // S7 — rose
  '#65a30d', // S8 — lime
  '#7c3aed', // S9 — indigo
];

let nextId = 1;
function generateId(prefix: string): string {
  return `${prefix}${nextId++}`;
}

let nextSolideIndex = 0;

/**
 * Returns a new Map with `id`'s item patched. Returns null if `id` is missing
 * so callers can short-circuit and skip the set() — no spurious undo entries.
 */
function patchInMap<T>(map: Map<string, T>, id: string, patch: Partial<T>): Map<string, T> | null {
  const item = map.get(id);
  if (!item) return null;
  const next = new Map(map);
  next.set(id, { ...item, ...patch });
  return next;
}

function createBati(): Solide {
  return { id: 's0', name: 'S0', color: SOLIDE_COLORS[0], isBati: true };
}

/**
 * Pause and resume the zundo temporal middleware. Call `pauseHistory()` at the
 * start of a drag (so intermediate frames don't pollute the undo stack) and
 * `resumeHistory()` at the end so the final position becomes the single
 * commit. Both wrap the verbose `useDiagramStore.temporal.getState()` access.
 */
export function pauseHistory() {
  useDiagramStore.temporal.getState().pause();
}
export function resumeHistory() {
  useDiagramStore.temporal.getState().resume();
}

export const useDiagramStore = create<DiagramState>()(
  temporal(
    (set, get) => ({
      dimension: '2d' as DiagramDimension,
      nodes: new Map<string, DiagramNode>(),
      links: new Map<string, Link>(),
      solides: new Map<string, Solide>([['s0', createBati()]]),
      angleArcs: new Map<string, AngleArc>(),
      selectedIds: new Set<string>(),
      activeTool: 'select' as ToolType,
      placingLiaison: null,
      linkSourceId: null,
      activeSolideId: 's0',
      selectedMidpoint: null,
      stageX: 0,
      stageY: 0,
      stageScale: 1,

      setDimension: (dim: DiagramDimension) => {
        set({ dimension: dim });
      },

      addNode: (type: LiaisonType, x: number, y: number, view: LiaisonView = 1, z = 0) => {
        const id = generateId('n');
        const node: DiagramNode = { id, type, view, x, y, z, rotation: 0, rotationX: 0, rotationY: 0, scale: 1, label: '', labelOffsetX: 20, labelOffsetY: -20 };
        set((state) => {
          const nodes = new Map(state.nodes);
          nodes.set(id, node);
          return { nodes };
        });
      },

      moveNode: (id: string, x: number, y: number, z?: number) => {
        set((state) => {
          const nodes = patchInMap(state.nodes, id, { x, y, ...(z !== undefined && { z }) });
          return nodes ? { nodes } : state;
        });
      },

      moveNodes: (moves: Array<{ id: string; x: number; y: number; z?: number }>) => {
        set((state) => {
          const nodes = new Map(state.nodes);
          for (const move of moves) {
            const node = nodes.get(move.id);
            if (node) {
              nodes.set(move.id, { ...node, x: move.x, y: move.y, ...(move.z !== undefined && { z: move.z }) });
            }
          }
          return { nodes };
        });
      },

      rotateNode: (id: string, rotation: number, rotationX?: number, rotationY?: number) => {
        set((state) => {
          const nodes = patchInMap(state.nodes, id, {
            rotation,
            ...(rotationX !== undefined && { rotationX }),
            ...(rotationY !== undefined && { rotationY }),
          });
          return nodes ? { nodes } : state;
        });
      },

      scaleNode: (id: string, scale: number) => {
        set((state) => {
          const nodes = patchInMap(state.nodes, id, { scale });
          return nodes ? { nodes } : state;
        });
      },

      deleteNode: (id: string) => {
        set((state) => {
          const nodes = new Map(state.nodes);
          const links = new Map(state.links);
          nodes.delete(id);
          for (const [linkId, link] of links) {
            if (link.fromNodeId === id || link.toNodeId === id) {
              links.delete(linkId);
            }
          }
          const selectedIds = new Set(state.selectedIds);
          selectedIds.delete(id);
          return { nodes, links, selectedIds };
        });
      },

      updateNodeLabel: (id: string, label: string) => {
        set((state) => {
          const nodes = patchInMap(state.nodes, id, { label });
          return nodes ? { nodes } : state;
        });
      },

      updateNodeView: (id: string, view: LiaisonView) => {
        set((state) => {
          const nodes = patchInMap(state.nodes, id, { view });
          return nodes ? { nodes } : state;
        });
      },

      updateNodeLabelOffset: (id: string, ox: number, oy: number) => {
        set((state) => {
          const nodes = patchInMap(state.nodes, id, { labelOffsetX: ox, labelOffsetY: oy });
          return nodes ? { nodes } : state;
        });
      },

      addLink: (fromNodeId: string, toNodeId: string, fromAnchorIdx?: number, toAnchorIdx?: number, fromAnchorOffset?: AnchorOffset, toAnchorOffset?: AnchorOffset) => {
        const state = get();
        const fromNode = state.nodes.get(fromNodeId);
        const toNode = state.nodes.get(toNodeId);
        // Force S0 (bâti) when linking from/to a bâti node
        const solideId = (fromNode?.type === 'bati' || toNode?.type === 'bati') ? 's0' : (state.activeSolideId || 's0');
        const id = generateId('l');

        const fromSolides = new Set<string>();
        const toSolides = new Set<string>();
        for (const l of state.links.values()) {
          if (l.fromNodeId === fromNodeId || l.toNodeId === fromNodeId) {
            fromSolides.add(l.solideId);
          }
          if (l.fromNodeId === toNodeId || l.toNodeId === toNodeId) {
            toSolides.add(l.solideId);
          }
        }
        const solideNum = solideId.replace('s', '');
        let label = '';
        const otherSolides = new Set([...fromSolides, ...toSolides]);
        otherSolides.delete(solideId);
        if (otherSolides.size > 0) {
          const otherNum = Array.from(otherSolides)[0].replace('s', '');
          const nums = [solideNum, otherNum].sort();
          label = `L${nums[0]}${nums[1]}`;
        }

        const link: Link = { id, fromNodeId, toNodeId, solideId, label, labelOffsetX: 8, labelOffsetY: -18, fromAnchorIdx, toAnchorIdx, fromAnchorOffset, toAnchorOffset };
        set((s) => {
          const links = new Map(s.links);
          links.set(id, link);
          return { links };
        });
      },

      deleteLink: (id: string) => {
        set((state) => {
          const links = new Map(state.links);
          links.delete(id);
          // Cascade: delete T-junction links whose host was just deleted
          for (const [childId, child] of links) {
            if (child.fromLinkId === id || child.toLinkId === id) {
              links.delete(childId);
            }
          }
          const selectedIds = new Set(state.selectedIds);
          selectedIds.delete(id);
          return { links, selectedIds };
        });
      },

      updateLinkLabel: (id: string, label: string) => {
        set((state) => {
          const links = patchInMap(state.links, id, { label });
          return links ? { links } : state;
        });
      },

      updateLinkLabelOffset: (id: string, ox: number, oy: number) => {
        set((state) => {
          const links = patchInMap(state.links, id, { labelOffsetX: ox, labelOffsetY: oy });
          return links ? { links } : state;
        });
      },

      updateLinkSolide: (id: string, solideId: string) => {
        set((state) => {
          const links = patchInMap(state.links, id, { solideId });
          return links ? { links } : state;
        });
      },

      updateLinkRouting: (id: string, mode: LinkRoutingMode) => {
        set((state) => {
          const links = patchInMap(state.links, id, {
            routingMode: mode === 'direct' ? undefined : mode,
          });
          return links ? { links } : state;
        });
      },

      updateLinkLineStyle: (id: string, style: LinkLineStyle) => {
        set((state) => {
          const links = patchInMap(state.links, id, {
            lineStyle: style === 'solid' ? undefined : style,
          });
          return links ? { links } : state;
        });
      },

      addLinkToLink: (fromNodeId: string, toLinkId: string, toLinkT: number, fromAnchorIdx?: number, fromAnchorOffset?: AnchorOffset) => {
        const state = get();
        const fromNode = state.nodes.get(fromNodeId);
        const solideId = fromNode?.type === 'bati' ? 's0' : (state.activeSolideId || 's0');
        const id = generateId('l');
        const link: Link = {
          id,
          fromNodeId,
          toNodeId: '',
          toLinkId,
          toLinkT,
          solideId,
          label: '',
          labelOffsetX: 8,
          labelOffsetY: -18,
          fromAnchorIdx,
          fromAnchorOffset,
        };
        set((s) => {
          const links = new Map(s.links);
          links.set(id, link);
          return { links };
        });
      },

      updateLinkArrows: (id: string, arrowStart: ArrowMarker, arrowEnd: ArrowMarker) => {
        set((state) => {
          const links = patchInMap(state.links, id, {
            arrowStart: arrowStart === 'none' ? undefined : arrowStart,
            arrowEnd: arrowEnd === 'none' ? undefined : arrowEnd,
          });
          return links ? { links } : state;
        });
      },

      updateLinkAnchor: (id: string, end: 'from' | 'to', anchorIdx: number, offset?: AnchorOffset) => {
        set((state) => {
          const patch: Partial<Link> = end === 'from'
            ? { fromAnchorIdx: anchorIdx, fromAnchorOffset: offset }
            : { toAnchorIdx: anchorIdx, toAnchorOffset: offset };
          const links = patchInMap(state.links, id, patch);
          return links ? { links } : state;
        });
      },

      reanchorLink: (id: string, end: 'from' | 'to', newNodeId: string, anchorIdx: number, offset?: AnchorOffset) => {
        set((state) => {
          const patch: Partial<Link> = end === 'from'
            ? { fromNodeId: newNodeId, fromAnchorIdx: anchorIdx, fromAnchorOffset: offset, fromLinkId: undefined, fromLinkT: undefined }
            : { toNodeId: newNodeId, toAnchorIdx: anchorIdx, toAnchorOffset: offset, toLinkId: undefined, toLinkT: undefined };
          const links = patchInMap(state.links, id, patch);
          return links ? { links } : state;
        });
      },

      updateLinkMidpoints: (id: string, midpoints: Array<{ x: number; y: number }>) => {
        set((state) => {
          const links = patchInMap(state.links, id, { midpoints: midpoints.length > 0 ? midpoints : undefined });
          return links ? { links } : state;
        });
      },

      addSolide: (isBati = false) => {
        nextSolideIndex++;
        const id = `s${nextSolideIndex}`;
        const colorIndex = nextSolideIndex % SOLIDE_COLORS.length;
        const solide: Solide = {
          id,
          name: `S${nextSolideIndex}`,
          color: SOLIDE_COLORS[colorIndex],
          isBati,
        };
        set((state) => {
          const solides = new Map(state.solides);
          solides.set(id, solide);
          return { solides, activeSolideId: id };
        });
        return id;
      },

      deleteSolide: (id: string) => {
        if (id === 's0') return;
        set((state) => {
          const solides = new Map(state.solides);
          const links = new Map(state.links);
          const angleArcs = new Map(state.angleArcs);
          solides.delete(id);
          for (const [linkId, link] of links) {
            if (link.solideId === id) {
              links.set(linkId, { ...link, solideId: 's0' });
            }
          }
          // Cascade delete angle arcs referencing this solide
          for (const [arcId, arc] of angleArcs) {
            if (arc.fromSolideId === id || arc.toSolideId === id) {
              angleArcs.delete(arcId);
            }
          }
          return {
            solides,
            links,
            angleArcs,
            activeSolideId: state.activeSolideId === id ? 's0' : state.activeSolideId,
          };
        });
      },

      setActiveSolide: (id: string | null) => {
        set({ activeSolideId: id });
      },

      updateSolideColor: (id: string, color: string) => {
        set((state) => {
          const solides = patchInMap(state.solides, id, { color });
          return solides ? { solides } : state;
        });
      },

      updateSolideName: (id: string, name: string) => {
        set((state) => {
          const solides = patchInMap(state.solides, id, { name });
          return solides ? { solides } : state;
        });
      },

      // Frame actions
      toggleSolideFrame: (id: string) => {
        set((state) => {
          const solides = new Map(state.solides);
          const solide = solides.get(id);
          if (!solide) return state;
          const showFrame = !solide.showFrame;

          // Compute initial position at centroid of connected nodes
          let frameX = solide.frameX ?? 0;
          let frameY = solide.frameY ?? 0;
          if (showFrame && solide.frameX === undefined) {
            const connectedNodes: DiagramNode[] = [];
            for (const link of state.links.values()) {
              if (link.solideId === id) {
                const from = state.nodes.get(link.fromNodeId);
                const to = state.nodes.get(link.toNodeId);
                if (from) connectedNodes.push(from);
                if (to) connectedNodes.push(to);
              }
            }
            if (connectedNodes.length > 0) {
              frameX = connectedNodes.reduce((s, n) => s + n.x, 0) / connectedNodes.length;
              frameY = connectedNodes.reduce((s, n) => s + n.y, 0) / connectedNodes.length;
            }
          }

          solides.set(id, {
            ...solide,
            showFrame,
            frameX,
            frameY,
            frameRotation: solide.frameRotation ?? 0,
            frameLabel: solide.frameLabel ?? `R${id.replace('s', '')}`,
          });
          return { solides };
        });
      },

      moveSolideFrame: (id: string, x: number, y: number) => {
        set((state) => {
          const solides = patchInMap(state.solides, id, { frameX: x, frameY: y });
          return solides ? { solides } : state;
        });
      },

      rotateSolideFrame: (id: string, rotation: number) => {
        set((state) => {
          const solides = patchInMap(state.solides, id, { frameRotation: rotation });
          return solides ? { solides } : state;
        });
      },

      updateSolideFrameLabel: (id: string, label: string) => {
        set((state) => {
          const solides = patchInMap(state.solides, id, { frameLabel: label });
          return solides ? { solides } : state;
        });
      },

      // Angle arc actions
      addAngleArc: (fromSolideId: string, toSolideId: string, x: number, y: number) => {
        const id = generateId('a');
        const toNum = toSolideId.replace('s', '');
        const arc: AngleArc = {
          id,
          fromSolideId,
          toSolideId,
          label: `θ${toNum}`,
          radius: 30,
          x,
          y,
          labelOffsetX: 0,
          labelOffsetY: -10,
        };
        set((state) => {
          const angleArcs = new Map(state.angleArcs);
          angleArcs.set(id, arc);
          return { angleArcs };
        });
      },

      deleteAngleArc: (id: string) => {
        set((state) => {
          const angleArcs = new Map(state.angleArcs);
          angleArcs.delete(id);
          const selectedIds = new Set(state.selectedIds);
          selectedIds.delete(id);
          return { angleArcs, selectedIds };
        });
      },

      moveAngleArc: (id: string, x: number, y: number) => {
        set((state) => {
          const angleArcs = patchInMap(state.angleArcs, id, { x, y });
          return angleArcs ? { angleArcs } : state;
        });
      },

      updateAngleArcLabel: (id: string, label: string) => {
        set((state) => {
          const angleArcs = patchInMap(state.angleArcs, id, { label });
          return angleArcs ? { angleArcs } : state;
        });
      },

      updateAngleArcLabelOffset: (id: string, ox: number, oy: number) => {
        set((state) => {
          const angleArcs = patchInMap(state.angleArcs, id, { labelOffsetX: ox, labelOffsetY: oy });
          return angleArcs ? { angleArcs } : state;
        });
      },

      select: (id: string) => {
        set({ selectedIds: new Set([id]), selectedMidpoint: null });
      },

      selectMultiple: (ids: string[]) => {
        set({ selectedIds: new Set(ids), selectedMidpoint: null });
      },

      clearSelection: () => {
        set({ selectedIds: new Set(), selectedMidpoint: null });
      },

      selectMidpoint: (linkId: string, index: number) => {
        set({ selectedMidpoint: { linkId, index } });
      },

      clearMidpointSelection: () => {
        set({ selectedMidpoint: null });
      },

      deleteSelectedMidpoint: () => {
        const state = get();
        if (!state.selectedMidpoint) return;
        const { linkId, index } = state.selectedMidpoint;
        const links = new Map(state.links);
        const link = links.get(linkId);
        if (!link || !link.midpoints) return;
        const newMidpoints = [...link.midpoints];
        newMidpoints.splice(index, 1);
        links.set(linkId, { ...link, midpoints: newMidpoints.length > 0 ? newMidpoints : undefined });
        set({ links, selectedMidpoint: null });
      },

      deleteSelected: () => {
        const state = get();
        const nodes = new Map(state.nodes);
        const links = new Map(state.links);
        const angleArcs = new Map(state.angleArcs);
        for (const id of state.selectedIds) {
          // Skip frame synthetic IDs (frame-s0, etc.) — hide via toggle instead
          if (id.startsWith('frame-')) continue;
          if (nodes.has(id)) {
            nodes.delete(id);
            for (const [linkId, link] of links) {
              if (link.fromNodeId === id || link.toNodeId === id) {
                links.delete(linkId);
              }
            }
          }
          if (links.has(id)) {
            links.delete(id);
          }
          if (angleArcs.has(id)) {
            angleArcs.delete(id);
          }
        }
        set({ nodes, links, angleArcs, selectedIds: new Set(), selectedMidpoint: null });
      },

      setTool: (tool: ToolType) => {
        set({ activeTool: tool, placingLiaison: null, linkSourceId: null });
      },

      setPlacingLiaison: (info: { type: LiaisonType; view: LiaisonView } | null) => {
        set({ placingLiaison: info, activeTool: info ? 'place' : 'select' });
      },

      setLinkSource: (id: string | null) => {
        set({ linkSourceId: id });
      },

      setStagePosition: (x: number, y: number) => {
        set({ stageX: x, stageY: y });
      },

      setStageScale: (scale: number) => {
        set({ stageScale: scale });
      },

      pasteNodes: (sourceNodes, sourceLinks) => {
        set((state) => {
          const nodes = new Map(state.nodes);
          const links = new Map(state.links);
          const idMap = new Map<string, string>();
          const newIds: string[] = [];

          for (const srcNode of sourceNodes) {
            const newId = generateId('n');
            idMap.set(srcNode.id, newId);
            newIds.push(newId);
            nodes.set(newId, {
              ...srcNode,
              id: newId,
              x: srcNode.x + 40,
              y: srcNode.y + 40,
              z: srcNode.z ?? 0,
              rotationX: srcNode.rotationX ?? 0,
              rotationY: srcNode.rotationY ?? 0,
            });
          }

          for (const srcLink of sourceLinks) {
            const newFromId = idMap.get(srcLink.fromNodeId);
            const newToId = idMap.get(srcLink.toNodeId);
            if (newFromId && newToId) {
              const newLinkId = generateId('l');
              links.set(newLinkId, {
                ...srcLink,
                id: newLinkId,
                fromNodeId: newFromId,
                toNodeId: newToId,
              });
            }
          }

          return { nodes, links, selectedIds: new Set(newIds) };
        });
      },

      loadDiagram: (data) => {
        set({
          nodes: new Map(data.nodes),
          links: new Map(data.links),
          solides: data.solides.size > 0 ? new Map(data.solides) : new Map([['s0', createBati()]]),
          angleArcs: data.angleArcs ? new Map(data.angleArcs) : new Map(),
          selectedIds: new Set(),
          selectedMidpoint: null,
          activeTool: 'select',
          placingLiaison: null,
          linkSourceId: null,
          activeSolideId: 's0',
        });
        let maxId = 0;
        for (const id of data.nodes.keys()) {
          const num = parseInt(id.slice(1), 10);
          if (num > maxId) maxId = num;
        }
        for (const id of data.links.keys()) {
          const num = parseInt(id.slice(1), 10);
          if (num > maxId) maxId = num;
        }
        if (data.angleArcs) {
          for (const id of data.angleArcs.keys()) {
            const num = parseInt(id.slice(1), 10);
            if (num > maxId) maxId = num;
          }
        }
        nextId = maxId + 1;
        let maxSolide = 0;
        for (const id of data.solides.keys()) {
          const num = parseInt(id.slice(1), 10);
          if (num > maxSolide) maxSolide = num;
        }
        nextSolideIndex = maxSolide;
      },

      clearDiagram: () => {
        set({
          nodes: new Map(),
          links: new Map(),
          solides: new Map([['s0', createBati()]]),
          angleArcs: new Map(),
          selectedIds: new Set(),
          selectedMidpoint: null,
          activeTool: 'select',
          placingLiaison: null,
          linkSourceId: null,
          activeSolideId: 's0',
        });
        nextId = 1;
        nextSolideIndex = 0;
      },
    }),
    {
      partialize: (state) => ({
        dimension: state.dimension,
        nodes: state.nodes,
        links: state.links,
        solides: state.solides,
        angleArcs: state.angleArcs,
      }),
    }
  )
);
