import { useMemo } from 'react';
import { useDiagramStore } from '../store/diagramStore';
import { LIAISON_DEFS } from '../liaisons';

export function LiaisonGraph() {
  const nodes = useDiagramStore((s) => s.nodes);
  const links = useDiagramStore((s) => s.links);
  const solides = useDiagramStore((s) => s.solides);

  // Build adjacency: for each node (liaison), find which solides connect through it
  const graph = useMemo(() => {
    // Collect solides per node
    const nodeSolides = new Map<string, Set<string>>();
    for (const link of links.values()) {
      if (!nodeSolides.has(link.fromNodeId)) nodeSolides.set(link.fromNodeId, new Set());
      if (!nodeSolides.has(link.toNodeId)) nodeSolides.set(link.toNodeId, new Set());
      nodeSolides.get(link.fromNodeId)!.add(link.solideId);
      nodeSolides.get(link.toNodeId)!.add(link.solideId);
    }

    // For each node connecting 2+ solides, create edges between all solide pairs
    const connections: Array<{
      solide1Name: string;
      solide2Name: string;
      liaisonName: string;
      nodeLabel: string;
    }> = [];

    for (const [nodeId, solideSet] of nodeSolides) {
      if (solideSet.size < 2) continue;
      const node = nodes.get(nodeId);
      if (!node) continue;

      const def = LIAISON_DEFS[node.type];
      const solideIds = Array.from(solideSet);

      for (let i = 0; i < solideIds.length; i++) {
        for (let j = i + 1; j < solideIds.length; j++) {
          const s1 = solides.get(solideIds[i]);
          const s2 = solides.get(solideIds[j]);
          connections.push({
            solide1Name: s1?.name || solideIds[i],
            solide2Name: s2?.name || solideIds[j],
            liaisonName: def?.name || node.type,
            nodeLabel: node.label || node.id,
          });
        }
      }
    }

    return connections;
  }, [nodes, links, solides]);

  // Build unique solide names for circular layout
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
          const p1 = positions.get(conn.solide1Name);
          const p2 = positions.get(conn.solide2Name);
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
                {conn.nodeLabel ? `${conn.liaisonName} (${conn.nodeLabel})` : conn.liaisonName}
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
