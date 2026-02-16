import { useMemo } from 'react';
import { useDiagramStore } from '../store/diagramStore';
import { LIAISON_DEFS } from '../liaisons';
import type { LiaisonType } from '../types';

// 2D planar constraints per liaison type (nc = 3 - dof_2D)
const NC_2D: Record<LiaisonType, number> = {
  pivot: 2,
  glissiere: 2,
  pivot_glissant: 1,
  rotule: 2, // In 2D, same as pivot
  encastrement: 3,
  helicoidale: 2,
  rotule_doigt: 2, // In 2D, same as pivot
  appui_plan: 1,
  lineaire_annulaire: 1,
  lineaire_rectiligne: 1,
  ponctuelle: 1,
};

export function MobilityPanel() {
  const nodes = useDiagramStore((s) => s.nodes);
  const links = useDiagramStore((s) => s.links);
  const solides = useDiagramStore((s) => s.solides);

  const analysis = useMemo(() => {
    // For each node, find which solides connect through it
    const nodeSolides = new Map<string, Set<string>>();
    for (const link of links.values()) {
      if (!nodeSolides.has(link.fromNodeId)) nodeSolides.set(link.fromNodeId, new Set());
      if (!nodeSolides.has(link.toNodeId)) nodeSolides.set(link.toNodeId, new Set());
      nodeSolides.get(link.fromNodeId)!.add(link.solideId);
      nodeSolides.get(link.toNodeId)!.add(link.solideId);
    }

    // Count effective liaisons (nodes connecting 2+ solides)
    // A node connecting k solides counts as (k-1) binary liaisons
    const liaisonEntries: Array<{ type: LiaisonType; count: number }> = [];
    for (const [nodeId, solideSet] of nodeSolides) {
      if (solideSet.size >= 2) {
        const node = nodes.get(nodeId);
        if (node) {
          liaisonEntries.push({
            type: node.type,
            count: solideSet.size - 1, // (k-1) binary liaisons
          });
        }
      }
    }

    const n = solides.size; // Number of solides (including bâti)
    if (n <= 1 || liaisonEntries.length === 0) return null;

    // Sum constraints
    let sumNc2D = 0;
    let sumDdl3D = 0;
    let totalBinaryLiaisons = 0;
    for (const entry of liaisonEntries) {
      sumNc2D += NC_2D[entry.type] * entry.count;
      sumDdl3D += LIAISON_DEFS[entry.type].dof * entry.count;
      totalBinaryLiaisons += entry.count;
    }

    // Grübler formula (2D planar)
    // m = 3(n-1) - Σ nc_i
    const m2D = 3 * (n - 1) - sumNc2D;

    // 3D formula: m = 6(n-1) - Σ(6 - ddl_i) = 6(n-1) - 6L + Σ ddl_i
    const m3D = 6 * (n - 1) - 6 * totalBinaryLiaisons + sumDdl3D;

    // Hyperstatisme (2D): h = -m if m < 0
    const h2D = m2D < 0 ? -m2D : 0;

    return {
      n,
      totalBinaryLiaisons,
      sumNc2D,
      sumDdl3D,
      m2D,
      m3D,
      h2D,
    };
  }, [nodes, links, solides]);

  if (!analysis) return null;

  const { n, totalBinaryLiaisons, sumNc2D, m2D, h2D } = analysis;

  return (
    <div className="mobility-panel">
      <div className="properties-title">Mobilité (Grübler)</div>
      <div className="mobility-formula">
        m = 3(n-1) - <span style={{ fontSize: 10 }}>Σ</span>nc
      </div>
      <div className="mobility-grid">
        <div className="mobility-row">
          <span className="mobility-label">Solides (n)</span>
          <span className="mobility-value">{n}</span>
        </div>
        <div className="mobility-row">
          <span className="mobility-label">Liaisons</span>
          <span className="mobility-value">{totalBinaryLiaisons}</span>
        </div>
        <div className="mobility-row">
          <span className="mobility-label">Σ nc (2D)</span>
          <span className="mobility-value">{sumNc2D}</span>
        </div>
        <div className="mobility-divider" />
        <div className="mobility-row">
          <span className="mobility-label">3(n-1)</span>
          <span className="mobility-value">{3 * (n - 1)}</span>
        </div>
        <div className={`mobility-row mobility-result ${m2D > 0 ? 'positive' : m2D === 0 ? 'zero' : 'negative'}`}>
          <span className="mobility-label">m (mobilité)</span>
          <span className="mobility-value">{m2D}</span>
        </div>
        {h2D > 0 && (
          <div className="mobility-row mobility-hyper">
            <span className="mobility-label">h (hyperstatisme)</span>
            <span className="mobility-value">{h2D}</span>
          </div>
        )}
      </div>
      <div className="mobility-interpretation">
        {m2D > 0 && `Mécanisme mobile (${m2D} degré${m2D > 1 ? 's' : ''} de mobilité)`}
        {m2D === 0 && 'Mécanisme isostatique'}
        {m2D < 0 && `Mécanisme hyperstatique (degré ${h2D})`}
      </div>
    </div>
  );
}
