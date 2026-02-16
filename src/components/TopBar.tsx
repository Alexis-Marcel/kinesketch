import { useCallback } from 'react';
import { useDiagramStore } from '../store/diagramStore';
import { exportPNG } from '../export/png';
import { exportSVG } from '../export/svg';
import { exportLaTeX } from '../export/latex';
import { saveKineSketch, loadKineSketch } from '../export/kinesketch';

interface TopBarProps {
  onZoomFit: () => void;
}

export function TopBar({ onZoomFit }: TopBarProps) {
  const clearDiagram = useDiagramStore((s) => s.clearDiagram);

  const handleNew = useCallback(() => {
    if (useDiagramStore.getState().nodes.size === 0 || window.confirm('Créer un nouveau schéma ? Les modifications non sauvegardées seront perdues.')) {
      clearDiagram();
    }
  }, [clearDiagram]);

  const handleSave = useCallback(() => {
    const state = useDiagramStore.getState();
    saveKineSketch(state);
  }, []);

  const handleOpen = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.kinesketch,.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      await loadKineSketch(file);
    };
    input.click();
  }, []);

  const handleExportPNG = useCallback(() => {
    exportPNG();
  }, []);

  const handleExportSVG = useCallback(() => {
    const state = useDiagramStore.getState();
    exportSVG(state);
  }, []);

  const handleExportLaTeX = useCallback(() => {
    const state = useDiagramStore.getState();
    exportLaTeX(state);
  }, []);

  return (
    <div className="topbar">
      <div className="topbar-brand">KineSketch</div>
      <div className="topbar-actions">
        <button className="topbar-btn" onClick={handleNew} title="Nouveau (Ctrl+N)">
          Nouveau
        </button>
        <button className="topbar-btn" onClick={handleOpen} title="Ouvrir (Ctrl+O)">
          Ouvrir
        </button>
        <button className="topbar-btn" onClick={handleSave} title="Sauvegarder (Ctrl+S)">
          Sauvegarder
        </button>
        <div className="topbar-separator" />
        <button className="topbar-btn" onClick={handleExportPNG} title="Exporter en PNG">
          PNG
        </button>
        <button className="topbar-btn" onClick={handleExportSVG} title="Exporter en SVG">
          SVG
        </button>
        <button className="topbar-btn" onClick={handleExportLaTeX} title="Exporter en LaTeX/TikZ">
          LaTeX
        </button>
        <div className="topbar-separator" />
        <button className="topbar-btn" onClick={onZoomFit} title="Zoom pour tout voir (F)">
          Cadrer
        </button>
      </div>
    </div>
  );
}
