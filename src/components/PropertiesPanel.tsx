import { useState } from 'react';
import { useDiagramStore } from '../store/diagramStore';
import { LIAISON_DEFS } from '../liaisons';

export function PropertiesPanel() {
  const selectedIds = useDiagramStore((s) => s.selectedIds);
  const nodes = useDiagramStore((s) => s.nodes);
  const links = useDiagramStore((s) => s.links);
  const solides = useDiagramStore((s) => s.solides);
  const angleArcs = useDiagramStore((s) => s.angleArcs);
  const updateNodeLabel = useDiagramStore((s) => s.updateNodeLabel);
  const updateLinkLabel = useDiagramStore((s) => s.updateLinkLabel);
  const rotateNode = useDiagramStore((s) => s.rotateNode);
  const updateLinkSolide = useDiagramStore((s) => s.updateLinkSolide);
  const rotateSolideFrame = useDiagramStore((s) => s.rotateSolideFrame);
  const updateSolideFrameLabel = useDiagramStore((s) => s.updateSolideFrameLabel);
  const updateAngleArcLabel = useDiagramStore((s) => s.updateAngleArcLabel);
  const addAngleArc = useDiagramStore((s) => s.addAngleArc);

  const [arcCreating, setArcCreating] = useState(false);

  if (selectedIds.size === 0) return null;

  const selectedId = Array.from(selectedIds)[0];

  // Frame selection (synthetic ID: frame-s0, frame-s1, ...)
  if (selectedId.startsWith('frame-')) {
    const solideId = selectedId.replace('frame-', '');
    const solide = solides.get(solideId);
    if (!solide || !solide.showFrame) return null;

    // List other solides with frames for arc creation
    const otherFrameSolides = Array.from(solides.values()).filter(
      (s) => s.id !== solideId && s.showFrame
    );

    return (
      <div className="properties-panel">
        <div className="properties-title">Repère local</div>

        <div className="prop-group">
          <label className="prop-label">Solide</label>
          <div className="prop-value">
            <span className="solide-color-inline" style={{ background: solide.color, marginRight: 6 }} />
            {solide.name}
          </div>
        </div>

        <div className="prop-group">
          <label className="prop-label">Label</label>
          <input
            className="prop-input"
            type="text"
            value={solide.frameLabel ?? ''}
            onChange={(e) => updateSolideFrameLabel(solideId, e.target.value)}
            placeholder="ex: R0, R1..."
          />
        </div>

        <div className="prop-group">
          <label className="prop-label">Rotation</label>
          <div className="prop-row">
            <input
              className="prop-input prop-input-small"
              type="number"
              value={Math.round(solide.frameRotation ?? 0)}
              onChange={(e) => rotateSolideFrame(solideId, Number(e.target.value))}
              step={15}
            />
            <span className="prop-unit">°</span>
          </div>
        </div>

        <div className="prop-group">
          <label className="prop-label">Position</label>
          <div className="prop-value prop-value-small">
            x: {Math.round(solide.frameX ?? 0)}, y: {Math.round(solide.frameY ?? 0)}
          </div>
        </div>

        {otherFrameSolides.length > 0 && (
          <div className="prop-group">
            <label className="prop-label">Arc angulaire</label>
            {!arcCreating ? (
              <button
                className="prop-btn"
                onClick={() => setArcCreating(true)}
              >
                + Ajouter arc
              </button>
            ) : (
              <div className="prop-arc-targets">
                <div className="prop-hint">Vers quel repère ?</div>
                {otherFrameSolides.map((s) => (
                  <button
                    key={s.id}
                    className="prop-btn prop-btn-small"
                    onClick={() => {
                      const fx = solide.frameX ?? 0;
                      const fy = solide.frameY ?? 0;
                      const tx = s.frameX ?? 0;
                      const ty = s.frameY ?? 0;
                      const cx = (fx + tx) / 2;
                      const cy = (fy + ty) / 2;
                      addAngleArc(solideId, s.id, cx, cy);
                      setArcCreating(false);
                    }}
                  >
                    <span className="solide-color-inline" style={{ background: s.color, marginRight: 4 }} />
                    {s.name}
                  </button>
                ))}
                <button
                  className="prop-btn prop-btn-cancel"
                  onClick={() => setArcCreating(false)}
                >
                  Annuler
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  const node = nodes.get(selectedId);
  const link = links.get(selectedId);
  const arc = angleArcs.get(selectedId);

  if (!node && !link && !arc) return null;

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

  if (arc) {
    const fromSolide = solides.get(arc.fromSolideId);
    const toSolide = solides.get(arc.toSolideId);

    return (
      <div className="properties-panel">
        <div className="properties-title">Arc angulaire</div>

        <div className="prop-group">
          <label className="prop-label">De → Vers</label>
          <div className="prop-value prop-value-small">
            {fromSolide?.name ?? '?'} → {toSolide?.name ?? '?'}
          </div>
        </div>

        <div className="prop-group">
          <label className="prop-label">Label</label>
          <input
            className="prop-input"
            type="text"
            value={arc.label}
            onChange={(e) => updateAngleArcLabel(arc.id, e.target.value)}
            placeholder="ex: θ1, α..."
          />
        </div>

        <div className="prop-group">
          <label className="prop-label">Position</label>
          <div className="prop-value prop-value-small">
            x: {Math.round(arc.x)}, y: {Math.round(arc.y)}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
