import { useDiagramStore } from '../store/diagramStore';
import { LIAISON_DEFS } from '../liaisons';

export function PropertiesPanel() {
  const selectedIds = useDiagramStore((s) => s.selectedIds);
  const nodes = useDiagramStore((s) => s.nodes);
  const links = useDiagramStore((s) => s.links);
  const solides = useDiagramStore((s) => s.solides);
  const updateNodeLabel = useDiagramStore((s) => s.updateNodeLabel);
  const updateLinkLabel = useDiagramStore((s) => s.updateLinkLabel);
  const rotateNode = useDiagramStore((s) => s.rotateNode);
  const updateLinkSolide = useDiagramStore((s) => s.updateLinkSolide);

  if (selectedIds.size === 0) return null;

  const selectedId = Array.from(selectedIds)[0];
  const node = nodes.get(selectedId);
  const link = links.get(selectedId);

  if (!node && !link) return null;

  const solideList = Array.from(solides.values());

  if (node) {
    const def = LIAISON_DEFS[node.type];
    return (
      <div className="properties-panel">
        <div className="properties-title">Propriétés</div>

        <div className="prop-group">
          <label className="prop-label">Type</label>
          <div className="prop-value">{def.name}</div>
        </div>

        <div className="prop-group">
          <label className="prop-label">DDL</label>
          <div className="prop-value">{def.dof}</div>
        </div>

        <div className="prop-group">
          <label className="prop-label">Label</label>
          <input
            className="prop-input"
            type="text"
            value={node.label}
            onChange={(e) => updateNodeLabel(node.id, e.target.value)}
            placeholder="ex: A, B..."
          />
        </div>

        <div className="prop-group">
          <label className="prop-label">Rotation</label>
          <div className="prop-row">
            <input
              className="prop-input prop-input-small"
              type="number"
              value={Math.round(node.rotation)}
              onChange={(e) => rotateNode(node.id, Number(e.target.value))}
              step={15}
            />
            <span className="prop-unit">°</span>
          </div>
        </div>

        <div className="prop-group">
          <label className="prop-label">Position</label>
          <div className="prop-value prop-value-small">
            x: {Math.round(node.x)}, y: {Math.round(node.y)}
          </div>
        </div>
      </div>
    );
  }

  if (link) {
    const fromNode = nodes.get(link.fromNodeId);
    const toNode = nodes.get(link.toNodeId);
    const currentSolide = solides.get(link.solideId);

    return (
      <div className="properties-panel">
        <div className="properties-title">Propriétés</div>

        <div className="prop-group">
          <label className="prop-label">Type</label>
          <div className="prop-value">Lien (solide)</div>
        </div>

        <div className="prop-group">
          <label className="prop-label">De → Vers</label>
          <div className="prop-value prop-value-small">
            {fromNode?.label || fromNode?.id || '?'} → {toNode?.label || toNode?.id || '?'}
          </div>
        </div>

        <div className="prop-group">
          <label className="prop-label">Label</label>
          <input
            className="prop-input"
            type="text"
            value={link.label}
            onChange={(e) => updateLinkLabel(link.id, e.target.value)}
            placeholder="ex: L01..."
          />
        </div>

        <div className="prop-group">
          <label className="prop-label">Solide</label>
          <select
            className="prop-select"
            value={link.solideId}
            onChange={(e) => updateLinkSolide(link.id, e.target.value)}
          >
            {solideList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}{s.isBati ? ' (bâti)' : ''}
              </option>
            ))}
          </select>
          {currentSolide && (
            <span
              className="solide-color-inline"
              style={{ background: currentSolide.color, marginLeft: 6 }}
            />
          )}
        </div>
      </div>
    );
  }

  return null;
}
