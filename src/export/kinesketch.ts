import { useDiagramStore } from '../store/diagramStore';
import type { DiagramNode, DiagramState, KineSketchFile, Link, Solide } from '../types';

const CURRENT_VERSION = '1.1';
const AUTOSAVE_KEY = 'kinesketch-autosave';

export function saveKineSketch(state: Pick<DiagramState, 'nodes' | 'links' | 'solides' | 'stageX' | 'stageY' | 'stageScale'>) {
  const file: KineSketchFile = {
    version: CURRENT_VERSION,
    name: 'Schema cinématique',
    nodes: Array.from(state.nodes.values()),
    links: Array.from(state.links.values()),
    solides: Array.from(state.solides.values()),
    canvas: {
      x: state.stageX,
      y: state.stageY,
      scale: state.stageScale,
    },
    metadata: {
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  const json = JSON.stringify(file, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'schema.kinesketch';
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

export async function loadKineSketch(file: File) {
  const text = await file.text();
  const data = JSON.parse(text) as KineSketchFile;

  if (!data.version || !data.nodes) {
    throw new Error('Fichier invalide');
  }

  const nodes = new Map<string, DiagramNode>();
  for (const node of data.nodes) {
    nodes.set(node.id, { ...node, labelOffsetX: node.labelOffsetX ?? 20, labelOffsetY: node.labelOffsetY ?? -20 });
  }

  const links = new Map<string, Link>();
  for (const link of data.links) {
    links.set(link.id, { ...link, solideId: link.solideId || 's0', labelOffsetX: link.labelOffsetX ?? 8, labelOffsetY: link.labelOffsetY ?? -18 });
  }

  const solides = new Map<string, Solide>();
  if (data.solides) {
    for (const solide of data.solides) {
      solides.set(solide.id, solide);
    }
  }

  const store = useDiagramStore.getState();
  store.loadDiagram({ nodes, links, solides });

  if (data.canvas) {
    store.setStagePosition(data.canvas.x, data.canvas.y);
    store.setStageScale(data.canvas.scale);
  }
}

// Auto-save to localStorage
export function autoSave() {
  const state = useDiagramStore.getState();
  const data: KineSketchFile = {
    version: CURRENT_VERSION,
    name: 'autosave',
    nodes: Array.from(state.nodes.values()),
    links: Array.from(state.links.values()),
    solides: Array.from(state.solides.values()),
    canvas: {
      x: state.stageX,
      y: state.stageY,
      scale: state.stageScale,
    },
    metadata: {
      createdAt: '',
      updatedAt: new Date().toISOString(),
    },
  };
  try {
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
  } catch {
    // localStorage full or unavailable — silently fail
  }
}

export function loadAutoSave(): boolean {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw) as KineSketchFile;
    if (!data.nodes || data.nodes.length === 0) return false;

    const nodes = new Map<string, DiagramNode>();
    for (const node of data.nodes) {
      nodes.set(node.id, { ...node, labelOffsetX: node.labelOffsetX ?? 20, labelOffsetY: node.labelOffsetY ?? -20 });
    }

    const links = new Map<string, Link>();
    for (const link of data.links) {
      links.set(link.id, { ...link, solideId: link.solideId || 's0', labelOffsetX: link.labelOffsetX ?? 8, labelOffsetY: link.labelOffsetY ?? -18 });
    }

    const solides = new Map<string, Solide>();
    if (data.solides) {
      for (const solide of data.solides) {
        solides.set(solide.id, solide);
      }
    }

    const store = useDiagramStore.getState();
    store.loadDiagram({ nodes, links, solides });

    if (data.canvas) {
      store.setStagePosition(data.canvas.x, data.canvas.y);
      store.setStageScale(data.canvas.scale);
    }

    return true;
  } catch {
    return false;
  }
}
