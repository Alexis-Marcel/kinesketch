import type { DiagramNode, DiagramState, Link, Solide } from '../types';

const SCALE = 1 / 40; // 40px = 1cm in TikZ

function tx(x: number): string {
  return (x * SCALE).toFixed(2);
}

function ty(y: number): string {
  return (-y * SCALE).toFixed(2); // Flip y-axis for TikZ
}

function coord(x: number, y: number): string {
  return `(${tx(x)}, ${ty(y)})`;
}

function escapeTex(s: string): string {
  return s.replace(/\\/g, '\\textbackslash{}')
    .replace(/[&%$#_{}~^]/g, (c) => `\\${c}`);
}

function hexToTikzColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `{RGB}{${r},${g},${b}}`;
}

function nodeToTikZ(node: DiagramNode, isBati: boolean): string {
  const lines: string[] = [];
  const cx = tx(node.x);
  const cy = ty(node.y);
  const rot = -node.rotation; // TikZ counterclockwise
  const view = node.view ?? 1;

  const scopeOpen = rot !== 0
    ? `  \\begin{scope}[shift={${coord(node.x, node.y)}}, rotate=${rot}]`
    : `  \\begin{scope}[shift={${coord(node.x, node.y)}}]`;
  const scopeClose = '  \\end{scope}';

  lines.push(`  % ${node.type} (vue ${view})${node.label ? ` — ${node.label}` : ''}`);
  lines.push(scopeOpen);

  switch (node.type) {
    case 'pivot':
      if (view === 2) {
        lines.push('    \\draw (0,0) circle (0.3);');
        lines.push('    \\draw (0,-0.5) -- (0,0.5);');
        lines.push('    \\fill (0,0) circle (0.06);');
      } else {
        lines.push('    \\draw (-0.375,-0.25) rectangle (0.375,0.25);');
        lines.push('    \\draw (-0.625,0) -- (0.625,0);');
        lines.push('    \\draw (-0.625,-0.2) -- (-0.625,0.2);');
        lines.push('    \\draw (0.625,-0.2) -- (0.625,0.2);');
      }
      break;

    case 'glissiere':
      if (view === 2) {
        lines.push('    \\draw (-0.375,-0.225) rectangle (0.375,0.225);');
        lines.push('    \\draw (-0.375,-0.225) -- (0.375,0.225);');
        lines.push('    \\draw (0.375,-0.225) -- (-0.375,0.225);');
      } else {
        lines.push('    \\draw (-0.375,-0.225) rectangle (0.375,0.225);');
        lines.push('    \\draw (-0.725,-0.325) -- (0.725,-0.325);');
        lines.push('    \\draw (-0.725,0.325) -- (0.725,0.325);');
      }
      break;

    case 'pivot_glissant':
      if (view === 2) {
        lines.push('    \\draw (0,0) circle (0.25);');
        lines.push('    \\draw (-0.175,-0.175) -- (0.175,0.175);');
        lines.push('    \\draw (0.175,-0.175) -- (-0.175,0.175);');
        lines.push('    \\fill (0,0) circle (0.06);');
      } else {
        lines.push('    \\draw (-0.375,-0.3) rectangle (0.375,0.3);');
        lines.push('    \\draw (-0.725,-0.4) -- (0.725,-0.4);');
        lines.push('    \\draw (-0.725,0.4) -- (0.725,0.4);');
        lines.push('    \\draw (0,0) circle (0.25);');
        lines.push('    \\fill (0,0) circle (0.06);');
      }
      break;

    case 'rotule':
      if (view === 2) {
        lines.push('    \\draw (0,0) circle (0.35);');
        lines.push('    \\draw (-0.45,0.35) -- (0.45,0.35);');
        lines.push('    \\fill (0,0) circle (0.06);');
      } else {
        lines.push('    \\draw (0,0) circle (0.35);');
        lines.push('    \\draw (0,-0.35) -- (0,0.35);');
        lines.push('    \\draw (-0.35,0) -- (0.35,0);');
        lines.push('    \\fill (0,0) circle (0.06);');
      }
      break;

    case 'encastrement':
      if (view === 2) {
        lines.push('    \\draw (-0.125,-0.45) rectangle (0.125,0.45);');
        lines.push('    \\draw (0.125,0) -- (0.375,0);');
        lines.push('    \\foreach \\y in {-0.45,-0.3,...,0.45} {');
        lines.push('      \\draw (-0.125,\\y) -- (-0.325,\\y-0.1);');
        lines.push('    }');
      } else {
        lines.push('    \\draw (-0.45,-0.125) rectangle (0.45,0.125);');
        lines.push('    \\draw (0,-0.125) -- (0,-0.375);');
        lines.push('    \\foreach \\x in {-0.45,-0.3,...,0.45} {');
        lines.push('      \\draw (\\x,0.125) -- (\\x-0.1,0.325);');
        lines.push('    }');
      }
      break;

    case 'helicoidale':
      if (view === 2) {
        lines.push('    \\draw (-0.375,-0.225) rectangle (0.375,0.225);');
        lines.push('    \\draw (-0.375,-0.225) -- (0.375,0.225);');
        lines.push('    \\draw (0.375,-0.225) -- (-0.375,0.225);');
        lines.push('    \\draw (0.375,-0.1) -- (0.525,0.1);');
        lines.push('    \\draw (0.525,0.1) -- (0.45,0.15);');
      } else {
        lines.push('    \\draw (0,0) circle (0.3);');
        lines.push('    \\fill (0,0) circle (0.06);');
        lines.push('    \\draw (-0.21,-0.21) -- (0.21,0.21);');
        lines.push('    \\draw (0,-0.5) -- (0,0.5);');
      }
      break;

    case 'rotule_doigt':
      if (view === 2) {
        lines.push('    \\draw (0,0) circle (0.35);');
        lines.push('    \\draw (-0.35,0) -- (0.35,0);');
        lines.push('    \\fill (0,0) circle (0.06);');
      } else {
        lines.push('    \\draw (0,0) circle (0.35);');
        lines.push('    \\draw (0,-0.35) -- (0,0.35);');
        lines.push('    \\fill (0,0) circle (0.06);');
      }
      break;

    case 'appui_plan':
      if (view === 2) {
        lines.push('    \\draw (0,-0.45) -- (0,0.45);');
        lines.push('    \\draw (0,0) -- (0.4,0);');
        lines.push('    \\foreach \\y in {-0.45,-0.3,...,0.45} {');
        lines.push('      \\draw (0,\\y) -- (-0.2,\\y-0.12);');
        lines.push('    }');
      } else {
        lines.push('    \\draw (-0.45,0) -- (0.45,0);');
        lines.push('    \\draw (0,0) -- (0,0.4);');
        lines.push('    \\foreach \\x in {-0.45,-0.3,...,0.45} {');
        lines.push('      \\draw (\\x,0) -- (\\x-0.12,-0.2);');
        lines.push('    }');
      }
      break;

    case 'lineaire_annulaire':
      if (view === 2) {
        lines.push('    \\draw (-0.5,-0.3) -- (0.5,-0.3);');
        lines.push('    \\draw (-0.5,0.3) -- (0.5,0.3);');
        lines.push('    \\fill (0,0) circle (0.06);');
      } else {
        lines.push('    \\draw (0,0) circle (0.3);');
        lines.push('    \\draw (0,-0.5) -- (0,0.5);');
        lines.push('    \\fill (0,0) circle (0.06);');
      }
      break;

    case 'lineaire_rectiligne':
      if (view === 2) {
        lines.push('    \\draw (-0.45,-0.1) -- (0.45,-0.1);');
        lines.push('    \\draw (-0.45,0.1) -- (0.45,0.1);');
        lines.push('    \\foreach \\x in {-0.45,-0.3,...,0.45} {');
        lines.push('      \\draw (\\x,0.1) -- (\\x-0.1,0.3);');
        lines.push('    }');
      } else {
        lines.push('    \\draw (-0.35,-0.3) -- (0,0.15);');
        lines.push('    \\draw (0.35,-0.3) -- (0,0.15);');
        lines.push('    \\draw (-0.45,0.15) -- (0.45,0.15);');
        lines.push('    \\foreach \\x in {-0.45,-0.3,...,0.45} {');
        lines.push('      \\draw (\\x,0.15) -- (\\x-0.1,0.35);');
        lines.push('    }');
      }
      break;

    case 'ponctuelle':
      if (view === 2) {
        lines.push('    \\draw (0,-0.1) circle (0.1);');
        lines.push('    \\draw (-0.45,0) -- (0.45,0);');
        lines.push('    \\foreach \\x in {-0.45,-0.3,...,0.45} {');
        lines.push('      \\draw (\\x,0) -- (\\x-0.1,-0.2);');
        lines.push('    }');
        lines.push('    \\draw (0,-0.2) -- (0,-0.4);');
      } else {
        lines.push('    \\draw (0,-0.1) circle (0.1);');
        lines.push('    \\draw (-0.45,0) -- (0.45,0);');
        lines.push('    \\foreach \\x in {-0.45,-0.3,...,0.45} {');
        lines.push('      \\draw (\\x,0) -- (\\x-0.1,-0.2);');
        lines.push('    }');
      }
      break;
  }

  // Bâti hatching
  if (isBati) {
    lines.push('    % Bâti');
    lines.push('    \\draw[thick] (-0.55,-0.6) -- (0.55,-0.6);');
    lines.push('    \\foreach \\x in {-0.4,-0.25,...,0.4} {');
    lines.push('      \\draw (\\x,-0.6) -- (\\x-0.15,-0.8);');
    lines.push('    }');
  }

  lines.push(scopeClose);

  // Label (outside scope to avoid rotation)
  if (node.label) {
    lines.push(`  \\node[above right, font=\\small] at (${cx}, ${cy}) {${escapeTex(node.label)}};`);
  }

  return lines.join('\n');
}

function linkToTikZ(link: Link, from: DiagramNode, to: DiagramNode, _solides: Map<string, Solide>): string {
  const colorName = `solide${link.solideId.replace('s', '')}`;
  const lines: string[] = [];

  lines.push(`  \\draw[${colorName}, thick] ${coord(from.x, from.y)} -- ${coord(to.x, to.y)};`);

  if (link.label) {
    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2;
    lines.push(`  \\node[${colorName}, font=\\small, above] at ${coord(midX, midY)} {${escapeTex(link.label)}};`);
  }

  return lines.join('\n');
}

export function generateLaTeXString(state: Pick<DiagramState, 'nodes' | 'links' | 'solides'>): string {
  const lines: string[] = [];

  // Detect bâti nodes
  const batiNodeIds = new Set<string>();
  for (const link of state.links.values()) {
    if (link.solideId === 's0') {
      batiNodeIds.add(link.fromNodeId);
      batiNodeIds.add(link.toNodeId);
    }
  }

  // Color definitions
  lines.push('% Couleurs des solides');
  for (const solide of state.solides.values()) {
    const colorName = `solide${solide.id.replace('s', '')}`;
    lines.push(`\\definecolor{${colorName}}${hexToTikzColor(solide.color)}`);
  }
  lines.push('');

  lines.push('\\begin{tikzpicture}[thick, >=stealth]');
  lines.push('');

  // Links first (behind nodes)
  if (state.links.size > 0) {
    lines.push('  % Liens (solides)');
    for (const link of state.links.values()) {
      const from = state.nodes.get(link.fromNodeId);
      const to = state.nodes.get(link.toNodeId);
      if (from && to) {
        lines.push(linkToTikZ(link, from, to, state.solides));
      }
    }
    lines.push('');
  }

  // Nodes
  if (state.nodes.size > 0) {
    lines.push('  % Liaisons');
    for (const node of state.nodes.values()) {
      lines.push(nodeToTikZ(node, batiNodeIds.has(node.id)));
      lines.push('');
    }
  }

  lines.push('\\end{tikzpicture}');

  return lines.join('\n');
}

export function exportLaTeX(state: Pick<DiagramState, 'nodes' | 'links' | 'solides'>) {
  const tex = generateLaTeXString(state);
  const blob = new Blob([tex], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'schema-cinematique.tex';
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
