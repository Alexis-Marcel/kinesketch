import { useMemo } from 'react';
import { useDiagramStore } from '../store/diagramStore';
import { LIAISON_DEFS } from '../liaisons';

export function LiaisonGraph() {
  const nodes = useDiagramStore((s) => s.nodes);
  const links = useDiagramStore((s) => s.links);
  const solides = useDiagramStore((s) => s.solides);

  // Build adjacency: which solides are connected by which liaison type
  const graph = useMemo(() => {
    const connections: Array<{
      solide1: string;
      solide2: string;
      liaisonType: string;
      liaisonName: string;
      linkLabel: string;
    }> = [];

    // For each link, find which solide owns that link and what nodes it connects
    // This is a simplification — we show the link's solide + connected nodes
    for (const link of links.values()) {
      const fromNode = nodes.get(link.fromNodeId);
      const toNode = nodes.get(link.toNodeId);
      if (!fromNode || !toNode) continue;

      const def = LIAISON_DEFS[fromNode.type];
      const solideName = solides.get(link.solideId)?.name || link.solideId;

      connections.push({
        solide1: solideName,
        solide2: toNode.label || toNode.id,
        liaisonType: fromNode.type,
        liaisonName: def?.name || fromNode.type,
        linkLabel: link.label || link.id,
      });
    }

    return connections;
  }, [nodes, links, solides]);

  // Build unique solide names from graph for circular layout
  const solideNames = useMemo(() => {
    const names = new Set<string>();
    for (const s of solides.values()) {
      names.add(s.name);
    }
    return Array.from(names);
  }, [solides]);

  if (solideNames.length <= 1 || graph.length === 0) return null;

  // Circular layout
  const cx = 100;
  const cy = 80;
  const radius = 55;
  const positions = new Map<string, { x: number; y: number }>();

  solideNames.forEach((name, i) => {
    const angle = (2 * Math.PI * i) / solideNames.length - Math.PI / 2;
    positions.set(name, {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  });

  return (
    <div className="liaison-graph-container">
      <div className="properties-title">Graphe des liaisons</div>
      <svg viewBox="0 0 200 160" className="liaison-graph-svg">
        {/* Edges */}
        {graph.map((conn, i) => {
          const p1 = positions.get(conn.solide1);
          const p2 = positions.get(conn.solide2);
          if (!p1 || !p2) return null;
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          return (
            <g key={i}>
              <line
                x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                stroke="#9ca3af"
                strokeWidth={1.5}
              />
              <text
                x={midX}
                y={midY - 4}
                textAnchor="middle"
                fontSize={7}
                fill="#6b7280"
              >
                {conn.liaisonName}
              </text>
            </g>
          );
        })}

        {/* Nodes (solides) */}
        {solideNames.map((name) => {
          const pos = positions.get(name);
          if (!pos) return null;
          const solide = Array.from(solides.values()).find((s) => s.name === name);
          const color = solide?.color || '#6b7280';
          return (
            <g key={name}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={16}
                fill="white"
                stroke={color}
                strokeWidth={2}
              />
              <text
                x={pos.x}
                y={pos.y + 4}
                textAnchor="middle"
                fontSize={9}
                fontWeight="600"
                fill={color}
              >
                {name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
