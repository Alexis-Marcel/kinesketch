import { useDiagramStore, SOLIDE_COLORS } from '../store/diagramStore';
import { LIAISON_LIST } from '../liaisons';
import type { LiaisonType } from '../types';

const TOOL_ICONS: Record<string, string> = {
  move: '⇔',
  select: '⊹',
  link: '⟶',
};

const LIAISON_ICONS: Record<LiaisonType, string> = {
  pivot: '◎',
  glissiere: '▭',
  pivot_glissant: '⊡',
  rotule: '⊕',
  encastrement: '⊞',
  helicoidale: '⊘',
  rotule_doigt: '⊖',
  appui_plan: '▬',
  lineaire_annulaire: '⊙',
  lineaire_rectiligne: '▽',
  ponctuelle: '·',
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
        {LIAISON_LIST.map((def) => (
          <button
            key={def.type}
            className={`toolbar-btn ${placingLiaison === def.type ? 'active' : ''}`}
            onClick={() => setPlacingLiaison(placingLiaison === def.type ? null : def.type)}
            title={`${def.name} — ${def.description}`}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData('application/kinesketch-liaison', def.type);
              e.dataTransfer.effectAllowed = 'copy';
            }}
          >
            <span className="toolbar-btn-icon">{LIAISON_ICONS[def.type]}</span>
            <span className="toolbar-btn-label">{def.name}</span>
          </button>
        ))}
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
