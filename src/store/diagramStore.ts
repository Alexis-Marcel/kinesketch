import { create } from 'zustand';
import { temporal } from 'zundo';
import type { DiagramNode, DiagramState, LiaisonType, Link, Solide, ToolType } from '../types';

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

function createBati(): Solide {
  return { id: 's0', name: 'S0', color: SOLIDE_COLORS[0], isBati: true };
}

export const useDiagramStore = create<DiagramState>()(
  temporal(
    (set, get) => ({
      nodes: new Map<string, DiagramNode>(),
      links: new Map<string, Link>(),
      solides: new Map<string, Solide>([['s0', createBati()]]),
      selectedIds: new Set<string>(),
      activeTool: 'select' as ToolType,
      placingLiaison: null,
      linkSourceId: null,
      activeSolideId: 's0',
      stageX: 0,
      stageY: 0,
      stageScale: 1,

      addNode: (type: LiaisonType, x: number, y: number) => {
        const id = generateId('n');
        const node: DiagramNode = { id, type, x, y, rotation: 0, label: '', labelOffsetX: 20, labelOffsetY: -20 };
        set((state) => {
          const nodes = new Map(state.nodes);
          nodes.set(id, node);
          return { nodes };
        });
      },

      moveNode: (id: string, x: number, y: number) => {
        set((state) => {
          const nodes = new Map(state.nodes);
          const node = nodes.get(id);
          if (!node) return state;
          nodes.set(id, { ...node, x, y });
          return { nodes };
        });
      },

      moveNodes: (moves: Array<{ id: string; x: number; y: number }>) => {
        set((state) => {
          const nodes = new Map(state.nodes);
          for (const move of moves) {
            const node = nodes.get(move.id);
            if (node) {
              nodes.set(move.id, { ...node, x: move.x, y: move.y });
            }
          }
          return { nodes };
        });
      },

      rotateNode: (id: string, rotation: number) => {
        set((state) => {
          const nodes = new Map(state.nodes);
          const node = nodes.get(id);
          if (!node) return state;
          nodes.set(id, { ...node, rotation });
          return { nodes };
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
          const nodes = new Map(state.nodes);
          const node = nodes.get(id);
          if (!node) return state;
          nodes.set(id, { ...node, label });
          return { nodes };
        });
      },

      updateNodeLabelOffset: (id: string, ox: number, oy: number) => {
        set((state) => {
          const nodes = new Map(state.nodes);
          const node = nodes.get(id);
          if (!node) return state;
          nodes.set(id, { ...node, labelOffsetX: ox, labelOffsetY: oy });
          return { nodes };
        });
      },

      addLink: (fromNodeId: string, toNodeId: string) => {
        const state = get();
        const solideId = state.activeSolideId || 's0';
        const id = generateId('l');

        // Auto-generate label from connected solide indices
        // Find which solides the from/to nodes belong to via existing links
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
        // Use the active solide + connected solides for label
        const solideNum = solideId.replace('s', '');
        let label = '';
        // Find the "other" solide that the target node connects to
        const otherSolides = new Set([...fromSolides, ...toSolides]);
        otherSolides.delete(solideId);
        if (otherSolides.size > 0) {
          const otherNum = Array.from(otherSolides)[0].replace('s', '');
          const nums = [solideNum, otherNum].sort();
          label = `L${nums[0]}${nums[1]}`;
        }

        const link: Link = { id, fromNodeId, toNodeId, solideId, label, labelOffsetX: 8, labelOffsetY: -18 };
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
          const selectedIds = new Set(state.selectedIds);
          selectedIds.delete(id);
          return { links, selectedIds };
        });
      },

      updateLinkLabel: (id: string, label: string) => {
        set((state) => {
          const links = new Map(state.links);
          const link = links.get(id);
          if (!link) return state;
          links.set(id, { ...link, label });
          return { links };
        });
      },

      updateLinkLabelOffset: (id: string, ox: number, oy: number) => {
        set((state) => {
          const links = new Map(state.links);
          const link = links.get(id);
          if (!link) return state;
          links.set(id, { ...link, labelOffsetX: ox, labelOffsetY: oy });
          return { links };
        });
      },

      updateLinkSolide: (id: string, solideId: string) => {
        set((state) => {
          const links = new Map(state.links);
          const link = links.get(id);
          if (!link) return state;
          links.set(id, { ...link, solideId });
          return { links };
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
          solides.delete(id);
          for (const [linkId, link] of links) {
            if (link.solideId === id) {
              links.set(linkId, { ...link, solideId: 's0' });
            }
          }
          return {
            solides,
            links,
            activeSolideId: state.activeSolideId === id ? 's0' : state.activeSolideId,
          };
        });
      },

      setActiveSolide: (id: string | null) => {
        set({ activeSolideId: id });
      },

      updateSolideColor: (id: string, color: string) => {
        set((state) => {
          const solides = new Map(state.solides);
          const solide = solides.get(id);
          if (!solide) return state;
          solides.set(id, { ...solide, color });
          return { solides };
        });
      },

      updateSolideName: (id: string, name: string) => {
        set((state) => {
          const solides = new Map(state.solides);
          const solide = solides.get(id);
          if (!solide) return state;
          solides.set(id, { ...solide, name });
          return { solides };
        });
      },

      select: (id: string) => {
        set({ selectedIds: new Set([id]) });
      },

      selectMultiple: (ids: string[]) => {
        set({ selectedIds: new Set(ids) });
      },

      clearSelection: () => {
        set({ selectedIds: new Set() });
      },

      deleteSelected: () => {
        const state = get();
        const nodes = new Map(state.nodes);
        const links = new Map(state.links);
        for (const id of state.selectedIds) {
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
        }
        set({ nodes, links, selectedIds: new Set() });
      },

      setTool: (tool: ToolType) => {
        set({ activeTool: tool, placingLiaison: null, linkSourceId: null });
      },

      setPlacingLiaison: (type: LiaisonType | null) => {
        set({ placingLiaison: type, activeTool: type ? 'place' : 'select' });
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
          selectedIds: new Set(),
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
          selectedIds: new Set(),
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
        nodes: state.nodes,
        links: state.links,
        solides: state.solides,
      }),
    }
  )
);
