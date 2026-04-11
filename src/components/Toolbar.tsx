'use client';

import { useDiagramStore, SOLIDE_COLORS } from '../store/diagramStore';
import { LIAISON_LIST, BATI_DEF } from '../liaisons';
import type { LiaisonType, LiaisonView } from '../types';
import { LIAISON_ICONS } from './LiaisonIcons';


// View number → human label, used inside multi-view liaison tiles.
const VIEW_LABELS: Record<number, string> = {
  1: 'Face',
  2: 'Côté',
  3: 'Persp.',
};

// =============================================================================
// Toolbar component
// =============================================================================

const TOOL_ICONS = {
  select: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m4 4 6 16 2-7 7-2z" />
    </svg>
  ),
  link: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  collapse: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
      <line x1="6" y1="2.5" x2="6" y2="13.5" />
    </svg>
  ),
};

interface ToolbarProps {
  onCollapse: () => void;
}

export function Toolbar({ onCollapse }: ToolbarProps) {
  const activeTool = useDiagramStore((s) => s.activeTool);
  const placingLiaison = useDiagramStore((s) => s.placingLiaison);
  const solides = useDiagramStore((s) => s.solides);
  const activeSolideId = useDiagramStore((s) => s.activeSolideId);
  const setTool = useDiagramStore((s) => s.setTool);
  const setPlacingLiaison = useDiagramStore((s) => s.setPlacingLiaison);
  const addSolide = useDiagramStore((s) => s.addSolide);
  const setActiveSolide = useDiagramStore((s) => s.setActiveSolide);
  const deleteSolide = useDiagramStore((s) => s.deleteSolide);
  const toggleSolideFrame = useDiagramStore((s) => s.toggleSolideFrame);

  const solideList = Array.from(solides.values());

  const renderLiaisonCard = (
    type: LiaisonType,
    name: string,
    description: string,
    viewCount: number
  ) => {
    const views = ([1, 2, 3] as LiaisonView[])
      .slice(0, viewCount)
      .filter((v) => LIAISON_ICONS[type]?.[v]);
    if (views.length === 0) return null;
    return (
      <div className="liaison-card" key={type}>
        <div className="liaison-card-name">{name}</div>
        <div className="liaison-tiles" data-count={views.length}>
          {views.map((v) => {
            const isActive = placingLiaison?.type === type && placingLiaison?.view === v;
            const label = views.length === 1 ? name : `${name} — vue ${v}`;
            return (
              <button
                key={`${type}:${v}`}
                className={`liaison-tile ${isActive ? 'active' : ''}`}
                onClick={() => setPlacingLiaison(isActive ? null : { type, view: v })}
                title={`${label}\n${description}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(
                    'application/kinesketch-liaison',
                    JSON.stringify({ type, view: v })
                  );
                  e.dataTransfer.effectAllowed = 'copy';
                }}
              >
                <span className="liaison-tile-icon">{LIAISON_ICONS[type][v]}</span>
                {views.length > 1 && (
                  <span className="liaison-tile-label">{VIEW_LABELS[v]}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="toolbar">
      <div className="toolbar-section">
        <div className="toolbar-title">
          Outils
          <button
            className="panel-collapse-btn"
            onClick={onCollapse}
            title="Masquer le volet gauche"
          >
            {TOOL_ICONS.collapse}
          </button>
        </div>
        <button
          className={`toolbar-btn ${activeTool === 'select' && !placingLiaison ? 'active' : ''}`}
          onClick={() => setTool('select')}
          title="Sélectionner (V)"
        >
          <span className="toolbar-btn-icon">{TOOL_ICONS.select}</span>
          <span className="toolbar-btn-label">Sélection</span>
        </button>
        <button
          className={`toolbar-btn ${activeTool === 'link' ? 'active' : ''}`}
          onClick={() => setTool('link')}
          title="Lier deux liaisons (L)"
        >
          <span className="toolbar-btn-icon">{TOOL_ICONS.link}</span>
          <span className="toolbar-btn-label">Lien</span>
        </button>
      </div>

      <div className="toolbar-section">
        <div className="toolbar-title">Solides</div>
        {solideList.map((solide) => (
          <div
            key={solide.id}
            className={`solide-item ${activeSolideId === solide.id ? 'active' : ''}`}
            onClick={() => setActiveSolide(solide.id)}
          >
            <span
              className="solide-color"
              style={{ background: solide.color }}
            />
            <span className="solide-name">
              {solide.name}
              {solide.isBati ? ' (bâti)' : ''}
            </span>
            <button
              className={`solide-frame-toggle ${solide.showFrame ? 'active' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleSolideFrame(solide.id);
              }}
              title={solide.showFrame ? 'Masquer le repère' : 'Afficher le repère'}
              style={solide.showFrame ? { color: solide.color } : undefined}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                <line x1="2" y1="12" x2="2" y2="2" />
                <line x1="2" y1="12" x2="12" y2="12" />
                <polyline points="2,4 0.5,5.5" />
                <polyline points="10,12 8.5,13.5" />
              </svg>
            </button>
            {!solide.isBati && (
              <button
                className="solide-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSolide(solide.id);
                }}
                title="Supprimer ce solide"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <button
          className="toolbar-btn solide-add-btn"
          onClick={() => addSolide()}
          title="Ajouter un solide"
        >
          <span className="toolbar-btn-icon">+</span>
          <span className="toolbar-btn-label">Ajouter solide</span>
        </button>
        <div className="solide-hint">
          Solide actif : les liens créés seront de la couleur{' '}
          <span
            className="solide-color-inline"
            style={{ background: solides.get(activeSolideId || 's0')?.color || SOLIDE_COLORS[0] }}
          />
        </div>
      </div>

      <div className="toolbar-section">
        <div className="toolbar-title">Liaisons</div>
        {/* Bâti is treated like any other liaison card */}
        {renderLiaisonCard('bati', BATI_DEF.name, BATI_DEF.description, 1)}
        {LIAISON_LIST.map((def) =>
          renderLiaisonCard(def.type, def.name, def.description, def.viewCount)
        )}
      </div>

      <div className="toolbar-section toolbar-help">
        <div className="toolbar-title">Raccourcis</div>
        <div className="shortcut"><kbd>V</kbd> Sélection</div>
        <div className="shortcut"><kbd>L</kbd> Lien</div>
        <div className="shortcut"><kbd>R</kbd> Rotation (+15°)</div>
        <div className="shortcut"><kbd>F</kbd> Zoom cadrer</div>
        <div className="shortcut"><kbd>1-9</kbd> Liaisons</div>
        <div className="shortcut"><kbd>Suppr</kbd> Supprimer</div>
        <div className="shortcut"><kbd>Ctrl+C</kbd> Copier</div>
        <div className="shortcut"><kbd>Ctrl+V</kbd> Coller</div>
        <div className="shortcut"><kbd>Ctrl+Z</kbd> Annuler</div>
        <div className="shortcut"><kbd>Ctrl+⇧+Z</kbd> Rétablir</div>
        <div className="shortcut"><kbd>Espace</kbd> Pan (maintenir)</div>
        <div className="shortcut"><kbd>Esc</kbd> Désélectionner</div>
        <div className="shortcut"><kbd>Dbl-clic</kbd> Éditer label</div>
      </div>
    </div>
  );
}
