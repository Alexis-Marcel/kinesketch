'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas } from './components/Canvas';
import { Canvas3D } from './components/Canvas3D';
import { Toolbar } from './components/Toolbar';
import { TopBar } from './components/TopBar';
import { PropertiesPanel } from './components/PropertiesPanel';
import { LiaisonTable } from './components/LiaisonTable';
import { LiaisonGraph } from './components/LiaisonGraph';
import { MobilityPanel } from './components/MobilityPanel';
import { useDiagramStore } from './store/diagramStore';
import { autoSave, loadAutoSave } from './export/kinesketch';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { CELL } from './utils/snap';
import './App.css';

const PANEL_TOGGLE_ICON = (split: 'left' | 'right') => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
    <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
    <line x1={split === 'left' ? 6 : 10} y1="2.5" x2={split === 'left' ? 6 : 10} y2="13.5" />
  </svg>
);

function CollapsedPanelButton({ side, onOpen }: { side: 'left' | 'right'; onOpen: () => void }) {
  return (
    <div className={`panel-collapsed panel-collapsed-${side}`}>
      <button
        className="panel-collapsed-btn"
        onClick={onOpen}
        title={side === 'left' ? 'Afficher le volet gauche' : 'Afficher le volet droit'}
      >
        {PANEL_TOGGLE_ICON(side)}
      </button>
    </div>
  );
}

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
    const px = node.x * CELL;
    const py = node.y * CELL;
    minX = Math.min(minX, px - 50);
    minY = Math.min(minY, py - 50);
    maxX = Math.max(maxX, px + 50);
    maxY = Math.max(maxY, py + 50);
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

export default function Editor() {
  const initialized = useRef(false);
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);
  const dimension = useDiagramStore((s) => s.dimension);

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

  useKeyboardShortcuts({ zoomFit });

  return (
    <div className="app">
      <TopBar onZoomFit={zoomFit} />
      <div className="app-body">
        {leftOpen ? (
          <Toolbar onCollapse={() => setLeftOpen(false)} />
        ) : (
          <CollapsedPanelButton side="left" onOpen={() => setLeftOpen(true)} />
        )}
        {dimension === '3d' ? <Canvas3D /> : <Canvas />}
        {rightOpen ? (
          <div className="right-panel">
            <div className="right-panel-header">
              <button
                className="panel-collapse-btn"
                onClick={() => setRightOpen(false)}
                title="Masquer le volet droit"
              >
                {PANEL_TOGGLE_ICON('right')}
              </button>
              <span className="properties-title" style={{ margin: 0, border: 'none', padding: 0 }}>Propriétés</span>
            </div>
            <PropertiesPanel />
            <MobilityPanel />
            <LiaisonTable />
            <LiaisonGraph />
          </div>
        ) : (
          <CollapsedPanelButton side="right" onOpen={() => setRightOpen(true)} />
        )}
      </div>
    </div>
  );
}
