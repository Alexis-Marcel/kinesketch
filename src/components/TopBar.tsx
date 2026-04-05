'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDiagramStore } from '../store/diagramStore';
import { exportPNG } from '../export/png';
import type { PNGExportOptions } from '../export/png';
import { exportSVG } from '../export/svg';
import { exportLaTeX } from '../export/latex';
import { saveKineSketch, loadKineSketch } from '../export/kinesketch';
import { useAuth } from '../auth/AuthProvider';

interface TopBarProps {
  onZoomFit: () => void;
}

export function TopBar({ onZoomFit }: TopBarProps) {
  const clearDiagram = useDiagramStore((s) => s.clearDiagram);
  const [pngDialogOpen, setPngDialogOpen] = useState(false);
  const [pngOptions, setPngOptions] = useState<PNGExportOptions>({
    includeGrid: false,
    includeAxes: false,
  });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, isPro, signOut } = useAuth();
  const router = useRouter();

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

  const handleExportSVG = useCallback(() => {
    const state = useDiagramStore.getState();
    exportSVG(state);
  }, []);

  const handleExportLaTeX = useCallback(() => {
    const state = useDiagramStore.getState();
    exportLaTeX(state);
  }, []);

  const handlePngExport = useCallback(() => {
    exportPNG(pngOptions);
    setPngDialogOpen(false);
  }, [pngOptions]);

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
        <button className="topbar-btn" onClick={() => setPngDialogOpen(true)} title="Exporter en PNG">
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

      {/* Auth / User menu */}
      <div style={{ marginLeft: 'auto', position: 'relative', display: 'flex', alignItems: 'center', gap: 8 }}>
        {!user ? (
          <>
            <span className="topbar-upgrade-btn" onClick={() => router.push('/pricing')}>
              Pro
            </span>
            <button className="topbar-btn" onClick={() => router.push('/login')}>
              Se connecter
            </button>
          </>
        ) : (
          <>
            {!isPro && (
              <span className="topbar-upgrade-btn" onClick={() => router.push('/pricing')}>
                Passer à Pro
              </span>
            )}
            {isPro && (
              <span className="topbar-pro-badge">Pro</span>
            )}
            <button
              className="topbar-user-btn"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              title="Mon compte"
            >
              {user.email?.charAt(0).toUpperCase() || '?'}
            </button>
            {userMenuOpen && (
              <>
                <div className="topbar-menu-overlay" onClick={() => setUserMenuOpen(false)} />
                <div className="topbar-user-menu">
                  <div className="topbar-user-email">{user.email}</div>
                  <button
                    className="topbar-menu-item"
                    onClick={() => { setUserMenuOpen(false); router.push('/account'); }}
                  >
                    Mon compte
                  </button>
                  <button
                    className="topbar-menu-item"
                    onClick={() => { setUserMenuOpen(false); router.push('/pricing'); }}
                  >
                    {isPro ? 'Mon abonnement' : 'Passer à Pro'}
                  </button>
                  <div className="topbar-menu-divider" />
                  <button
                    className="topbar-menu-item topbar-menu-item-danger"
                    onClick={async () => { setUserMenuOpen(false); await signOut(); }}
                  >
                    Se déconnecter
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* PNG export dialog */}
      {pngDialogOpen && (
        <div className="export-overlay" onClick={() => setPngDialogOpen(false)}>
          <div className="export-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="export-dialog-title">Export PNG</div>
            <label className="export-checkbox">
              <input
                type="checkbox"
                checked={pngOptions.includeGrid}
                onChange={(e) => setPngOptions({ ...pngOptions, includeGrid: e.target.checked })}
              />
              Grille
            </label>
            <label className="export-checkbox">
              <input
                type="checkbox"
                checked={pngOptions.includeAxes}
                onChange={(e) => setPngOptions({ ...pngOptions, includeAxes: e.target.checked })}
              />
              Axes X / Y
            </label>
            <div className="export-dialog-actions">
              <button className="topbar-btn" onClick={() => setPngDialogOpen(false)}>
                Annuler
              </button>
              <button className="topbar-btn export-btn-primary" onClick={handlePngExport}>
                Exporter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
