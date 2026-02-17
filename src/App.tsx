import { useEffect, useRef, useState } from 'react';
import { Canvas } from './components/Canvas';
import { Toolbar } from './components/Toolbar';
import { TopBar } from './components/TopBar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { LiaisonTable } from './components/LiaisonTable';
import { LiaisonGraph } from './components/LiaisonGraph';
import { MobilityPanel } from './components/MobilityPanel';
import { useDiagramStore } from './store/diagramStore';
import { autoSave, loadAutoSave, saveKineSketch } from './export/kinesketch';
import { LIAISON_LIST } from './liaisons';
import type { DiagramNode, Link } from './types';
import './App.css';

// Clipboard for copy/paste
let clipboard: { nodes: DiagramNode[]; links: Link[] } | null = null;

function zoomFit() {
  const state = useDiagramStore.getState();
  const nodes = state.nodes;
  if (nodes.size === 0) {
    state.setStagePosition(0, 0);
    state.setStageScale(1);
    return;
  }

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of nodes.values()) {
    minX = Math.min(minX, node.x - 50);
    minY = Math.min(minY, node.y - 50);
    maxX = Math.max(maxX, node.x + 50);
    maxY = Math.max(maxY, node.y + 50);
  }

  const canvasEl = document.querySelector('.canvas-wrapper');
  const canvasWidth = canvasEl ? canvasEl.clientWidth : window.innerWidth - 460;
  const canvasHeight = canvasEl ? canvasEl.clientHeight : window.innerHeight - 48;
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;

  const scale = Math.min(
    canvasWidth / contentWidth,
    canvasHeight / contentHeight,
    2
  ) * 0.9;

  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  state.setStageScale(scale);
  state.setStagePosition(
    canvasWidth / 2 - centerX * scale,
    canvasHeight / 2 - centerY * scale
  );
}

export default function App() {
  const initialized = useRef(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  // Load autosave on mount
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      loadAutoSave();
    }
  }, []);

  // Autosave on changes (debounced)
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const unsub = useDiagramStore.subscribe(() => {
      clearTimeout(timeout);
      timeout = setTimeout(autoSave, 500);
    });
    return () => {
      unsub();
      clearTimeout(timeout);
    };
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = useDiagramStore.getState();
      const target = e.target as HTMLElement;

      // Ignore if typing in an input
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      // Ctrl+C — copy
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        const selectedNodes = Array.from(state.selectedIds)
          .map((id) => state.nodes.get(id))
          .filter((n): n is DiagramNode => !!n);
        if (selectedNodes.length === 0) return;

        const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
        const selectedLinks = Array.from(state.links.values()).filter(
          (l) => selectedNodeIds.has(l.fromNodeId) && selectedNodeIds.has(l.toNodeId)
        );
        clipboard = { nodes: selectedNodes, links: selectedLinks };
        return;
      }

      // Ctrl+V — paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        if (!clipboard || clipboard.nodes.length === 0) return;
        state.pasteNodes(clipboard.nodes, clipboard.links);
        // Update clipboard positions so next paste offsets further
        clipboard = {
          nodes: clipboard.nodes.map((n) => ({ ...n, x: n.x + 40, y: n.y + 40 })),
          links: clipboard.links,
        };
        return;
      }

      // Ctrl+Z / Ctrl+Shift+Z — undo/redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          useDiagramStore.temporal.getState().redo();
        } else {
          useDiagramStore.temporal.getState().undo();
        }
        return;
      }

      // Ctrl+S — save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveKineSketch(state);
        return;
      }

      // Delete / Backspace — delete selected
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        state.deleteSelected();
        return;
      }

      // Escape — deselect / cancel tool
      if (e.key === 'Escape') {
        state.clearSelection();
        state.setTool('select');
        return;
      }

      // V — select tool
      if (e.key === 'v' || e.key === 'V') {
        state.setTool('select');
        return;
      }

      // H — move/pan tool (hand)
      if (e.key === 'h' || e.key === 'H') {
        state.setTool('move');
        return;
      }

      // L — link tool
      if (e.key === 'l' || e.key === 'L') {
        state.setTool('link');
        return;
      }

      // R — rotate selected node by 15°
      if (e.key === 'r' || e.key === 'R') {
        for (const id of state.selectedIds) {
          const node = state.nodes.get(id);
          if (node) {
            const step = e.shiftKey ? -15 : 15;
            state.rotateNode(id, (node.rotation + step) % 360);
          }
        }
        return;
      }

      // F — zoom fit
      if (e.key === 'f' || e.key === 'F') {
        zoomFit();
        return;
      }

      // Number keys 1-9 for liaison shortcuts (vue 1 by default)
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9 && num <= LIAISON_LIST.length) {
        const liaisonDef = LIAISON_LIST[num - 1];
        const current = state.placingLiaison;
        if (current?.type === liaisonDef.type) {
          state.setPlacingLiaison(null);
        } else {
          state.setPlacingLiaison({ type: liaisonDef.type, view: 1 });
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="app">
      <TopBar onZoomFit={zoomFit} />
      <div className="app-body">
        {leftOpen ? (
          <Toolbar onCollapse={() => setLeftOpen(false)} />
        ) : (
          <div className="panel-collapsed panel-collapsed-left">
            <button
              className="panel-collapsed-btn"
              onClick={() => setLeftOpen(true)}
              title="Afficher le volet gauche"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
                <line x1="6" y1="2.5" x2="6" y2="13.5" />
              </svg>
            </button>
          </div>
        )}
        <Canvas />
        {rightOpen ? (
          <div className="right-panel">
            <div className="right-panel-header">
              <button
                className="panel-collapse-btn"
                onClick={() => setRightOpen(false)}
                title="Masquer le volet droit"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                  <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
                  <line x1="10" y1="2.5" x2="10" y2="13.5" />
                </svg>
              </button>
              <span className="properties-title" style={{ margin: 0, border: 'none', padding: 0 }}>Propriétés</span>
            </div>
            <PropertiesPanel />
            <MobilityPanel />
            <LiaisonTable />
            <LiaisonGraph />
          </div>
        ) : (
          <div className="panel-collapsed panel-collapsed-right">
            <button
              className="panel-collapsed-btn"
              onClick={() => setRightOpen(true)}
              title="Afficher le volet droit"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
                <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
                <line x1="10" y1="2.5" x2="10" y2="13.5" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
