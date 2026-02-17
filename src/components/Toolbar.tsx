import type { ReactNode } from 'react';
import { useDiagramStore, SOLIDE_COLORS } from '../store/diagramStore';
import { LIAISON_LIST } from '../liaisons';
import type { LiaisonType, LiaisonView } from '../types';

const TOOL_ICONS: Record<string, string> = {
  move: '⇔',
  select: '⊹',
  link: '⟶',
};

const li = (children: ReactNode) => (
  <svg width="18" height="18" viewBox="-1 -1 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);

const LIAISON_ICONS: Record<LiaisonType, Record<number, ReactNode>> = {
  pivot: {
    1: li(<>
      <rect x="3" y="6" width="14" height="8" />
      <line x1="1" y1="10" x2="19" y2="10" />
      <line x1="1" y1="7" x2="1" y2="13" />
      <line x1="19" y1="7" x2="19" y2="13" />
    </>),
    2: li(<circle cx="10" cy="10" r="7" />),
  },
  glissiere: {
    1: li(<rect x="3" y="6" width="14" height="8" />),
    2: li(<>
      <rect x="5" y="5" width="10" height="10" />
      <line x1="5" y1="5" x2="15" y2="15" />
      <line x1="15" y1="5" x2="5" y2="15" />
    </>),
  },
  pivot_glissant: {
    1: li(<>
      <rect x="3" y="6" width="14" height="8" />
      <line x1="3" y1="10" x2="17" y2="10" />
    </>),
    2: li(<>
      <circle cx="10" cy="10" r="7" />
      <circle cx="10" cy="10" r="1.5" fill="currentColor" stroke="none" />
    </>),
  },
  rotule: {
    1: li(<>
      <circle cx="10" cy="10" r="4.5" />
      <path d="M 15,15 A 7,7 0 1,1 15,5" />
    </>),
  },
  encastrement: {
    1: li(<line x1="3" y1="10" x2="17" y2="10" />),
  },
  helicoidale: {
    1: li(<>
      <rect x="3" y="6" width="14" height="8" />
      <line x1="3" y1="6" x2="17" y2="14" />
    </>),
    2: li(<>
      <circle cx="10" cy="10" r="7" />
      <path d="M 10,6.5 A 3.5,3.5 0 0,1 10,13.5" />
    </>),
  },
  rotule_doigt: {
    1: li(<>
      <circle cx="10" cy="10" r="4.5" />
      <path d="M 15,15 A 7,7 0 1,1 15,5" />
      <line x1="6.8" y1="13.2" x2="3.5" y2="16.5" />
    </>),
  },
  appui_plan: {
    1: li(<>
      <line x1="4" y1="8" x2="16" y2="8" />
      <line x1="4" y1="12" x2="16" y2="12" />
    </>),
  },
  lineaire_annulaire: {
    1: li(<>
      <rect x="3" y="9" width="14" height="8" />
      <circle cx="10" cy="9" r="5" fill="white" />
    </>),
    2: li(<>
      <circle cx="10" cy="6" r="5" />
      <path d="M 17,6 A 7,7 0 0,1 3,6" />
      <line x1="3" y1="13" x2="17" y2="13" />
    </>),
  },
  lineaire_rectiligne: {
    1: li(<>
      <line x1="2" y1="4" x2="18" y2="4" />
      <line x1="2" y1="4" x2="7" y2="16" />
      <line x1="18" y1="4" x2="13" y2="16" />
      <line x1="2" y1="16" x2="18" y2="16" />
    </>),
    2: li(<>
      <line x1="2" y1="4" x2="18" y2="4" />
      <line x1="2" y1="4" x2="10" y2="16" />
      <line x1="18" y1="4" x2="10" y2="16" />
      <line x1="2" y1="16" x2="18" y2="16" />
    </>),
  },
  ponctuelle: {
    1: li(<>
      <circle cx="10" cy="7" r="5" />
      <line x1="3" y1="14" x2="17" y2="14" />
    </>),
  },
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
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
              <rect x="1.5" y="2.5" width="13" height="11" rx="1.5" />
              <line x1="6" y1="2.5" x2="6" y2="13.5" />
            </svg>
          </button>
        </div>
        <button
          className={`toolbar-btn ${activeTool === 'move' ? 'active' : ''}`}
          onClick={() => setTool('move')}
          title="Déplacer le canvas (H)"
        >
          <span className="toolbar-btn-icon">{TOOL_ICONS.move}</span>
          <span className="toolbar-btn-label">Déplacer</span>
        </button>
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
        {LIAISON_LIST.map((def) => {
          const views = ([1, 2] as LiaisonView[]).slice(0, def.viewCount);
          const buttons = views.map((v) => {
            const isActive = placingLiaison?.type === def.type && placingLiaison?.view === v;
            const label = def.viewCount === 1 ? def.name : `${def.name} vue ${v}`;
            return (
              <button
                key={`${def.type}:${v}`}
                className={`toolbar-btn ${isActive ? 'active' : ''}`}
                onClick={() => setPlacingLiaison(isActive ? null : { type: def.type, view: v })}
                title={`${label} — ${def.description}`}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('application/kinesketch-liaison', JSON.stringify({ type: def.type, view: v }));
                  e.dataTransfer.effectAllowed = 'copy';
                }}
              >
                <span className="toolbar-btn-icon">{LIAISON_ICONS[def.type][v]}</span>
                <span className="toolbar-btn-label">{label}</span>
              </button>
            );
          });
          return (
            <div key={def.type} className="toolbar-liaison-category">
              <div className="toolbar-liaison-name">{def.name}</div>
              {buttons}
            </div>
          );
        })}
      </div>

      <div className="toolbar-section toolbar-help">
        <div className="toolbar-title">Raccourcis</div>
        <div className="shortcut"><kbd>H</kbd> Déplacer</div>
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
