import { useDiagramStore } from '../store/diagramStore';
import { LIAISON_DEFS } from '../liaisons';

export function LiaisonTable() {
  const nodes = useDiagramStore((s) => s.nodes);
  const links = useDiagramStore((s) => s.links);
  const solides = useDiagramStore((s) => s.solides);

  const linkList = Array.from(links.values());

  if (linkList.length === 0) return null;

  return (
    <div className="liaison-table-container">
      <div className="properties-title">Tableau des liaisons</div>
      <table className="liaison-table">
        <thead>
          <tr>
            <th>Liaison</th>
            <th>Type</th>
            <th>Solides</th>
            <th>DDL</th>
          </tr>
        </thead>
        <tbody>
          {linkList.map((link) => {
            const fromNode = nodes.get(link.fromNodeId);
            const toNode = nodes.get(link.toNodeId);
            if (!fromNode || !toNode) return null;

            const def = LIAISON_DEFS[fromNode.type];
            const solide = solides.get(link.solideId);

            const solideName = solide?.name || '?';

            return (
              <tr key={link.id}>
                <td>{link.label || link.id}</td>
                <td>{def?.name || '—'}</td>
                <td>
                  <span
                    className="solide-color-inline"
                    style={{ background: solide?.color || '#999', marginRight: 4 }}
                  />
                  {solideName}
                </td>
                <td>{def?.dof ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
