import type { DiagramNode, DiagramState, Link, Solide } from '../types';

function nodeToSVG(node: DiagramNode): string {
  const transform = `translate(${node.x}, ${node.y}) rotate(${node.rotation})`;
  const stroke = '#1a1a1a';
  const sw = 2;

  switch (node.type) {
    case 'pivot':
      return `<g transform="${transform}">
        <circle r="12" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-20" y1="0" x2="20" y2="0" stroke="${stroke}" stroke-width="${sw}"/>
        <circle r="2.5" fill="${stroke}"/>
        ${labelSVG(node)}
      </g>`;

    case 'glissiere':
      return `<g transform="${transform}">
        <rect x="-15" y="-9" width="30" height="18" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-29" y1="-13" x2="29" y2="-13" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-29" y1="13" x2="29" y2="13" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;

    case 'pivot_glissant':
      return `<g transform="${transform}">
        <rect x="-15" y="-12" width="30" height="24" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-29" y1="-16" x2="29" y2="-16" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-29" y1="16" x2="29" y2="16" stroke="${stroke}" stroke-width="${sw}"/>
        <circle r="10" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <circle r="2.5" fill="${stroke}"/>
        ${labelSVG(node)}
      </g>`;

    case 'rotule':
      return `<g transform="${transform}">
        <circle r="14" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="0" y1="-14" x2="0" y2="14" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-14" y1="0" x2="14" y2="0" stroke="${stroke}" stroke-width="${sw}"/>
        <circle r="2.5" fill="${stroke}"/>
        ${labelSVG(node)}
      </g>`;

    case 'encastrement': {
      const w = 36, h = 10;
      const hatches = [];
      const count = Math.floor(w / 6);
      for (let i = 0; i <= count; i++) {
        const xPos = -w / 2 + i * 6;
        hatches.push(`<line x1="${xPos}" y1="${h / 2}" x2="${xPos - 4}" y2="${h / 2 + 8}" stroke="${stroke}" stroke-width="1.5"/>`);
      }
      return `<g transform="${transform}">
        <rect x="-18" y="-5" width="36" height="10" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        ${hatches.join('\n        ')}
        <line x1="0" y1="-5" x2="0" y2="-15" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;
    }

    case 'helicoidale': {
      const r = 12;
      return `<g transform="${transform}">
        <circle r="${r}" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <circle r="2.5" fill="${stroke}"/>
        <line x1="${-r * 0.7}" y1="${-r * 0.7}" x2="${r * 0.7}" y2="${r * 0.7}" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="0" y1="${-r - 8}" x2="0" y2="${r + 8}" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;
    }

    case 'rotule_doigt': {
      const r = 14;
      return `<g transform="${transform}">
        <circle r="${r}" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="0" y1="${-r}" x2="0" y2="${r}" stroke="${stroke}" stroke-width="${sw}"/>
        <circle r="2.5" fill="${stroke}"/>
        ${labelSVG(node)}
      </g>`;
    }

    case 'appui_plan': {
      const w = 36;
      const hatches = [];
      for (let i = 0; i <= 7; i++) {
        const xPos = -w / 2 + i * (w / 7);
        hatches.push(`<line x1="${xPos}" y1="0" x2="${xPos - 5}" y2="8" stroke="${stroke}" stroke-width="1.5"/>`);
      }
      return `<g transform="${transform}">
        <line x1="${-w / 2}" y1="0" x2="${w / 2}" y2="0" stroke="${stroke}" stroke-width="${sw}"/>
        ${hatches.join('\n        ')}
        <line x1="0" y1="-16" x2="0" y2="0" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;
    }

    case 'lineaire_annulaire': {
      const r = 12;
      return `<g transform="${transform}">
        <circle r="${r}" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="0" y1="${-(r + 8)}" x2="0" y2="${r + 8}" stroke="${stroke}" stroke-width="${sw}"/>
        <circle r="2.5" fill="${stroke}"/>
        ${labelSVG(node)}
      </g>`;
    }

    case 'lineaire_rectiligne': {
      const hatches = [];
      for (let i = 0; i < 7; i++) {
        const xPos = -18 + i * 6;
        hatches.push(`<line x1="${xPos}" y1="6" x2="${xPos - 4}" y2="14" stroke="${stroke}" stroke-width="1.5"/>`);
      }
      return `<g transform="${transform}">
        <line x1="-14" y1="-12" x2="0" y2="6" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="14" y1="-12" x2="0" y2="6" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-18" y1="6" x2="18" y2="6" stroke="${stroke}" stroke-width="${sw}"/>
        ${hatches.join('\n        ')}
        ${labelSVG(node)}
      </g>`;
    }

    case 'ponctuelle': {
      const hatches = [];
      for (let i = 0; i < 7; i++) {
        const xPos = -18 + i * 6;
        hatches.push(`<line x1="${xPos}" y1="0" x2="${xPos - 4}" y2="8" stroke="${stroke}" stroke-width="1.5"/>`);
      }
      return `<g transform="${transform}">
        <circle cy="-4" r="4" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-18" y1="0" x2="18" y2="0" stroke="${stroke}" stroke-width="${sw}"/>
        ${hatches.join('\n        ')}
        ${labelSVG(node)}
      </g>`;
    }
  }
}

function labelSVG(node: DiagramNode): string {
  if (!node.label) return '';
  return `<text x="20" y="-16" font-size="13" font-family="Inter,system-ui,sans-serif" fill="#374151">${escapeXml(node.label)}</text>`;
}

function linkToSVG(link: Link, from: DiagramNode, to: DiagramNode, solides: Map<string, Solide>): string {
  const solide = solides.get(link.solideId);
  const color = solide?.color || '#4b5563';
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  return `<g>
    <line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${color}" stroke-width="2"/>
    ${link.label ? `<text x="${midX + 8}" y="${midY - 10}" font-size="13" font-family="Inter,system-ui,sans-serif" fill="${color}">${escapeXml(link.label)}</text>` : ''}
  </g>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function computeBounds(nodes: Map<string, DiagramNode>): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of nodes.values()) {
    minX = Math.min(minX, node.x - 40);
    minY = Math.min(minY, node.y - 40);
    maxX = Math.max(maxX, node.x + 40);
    maxY = Math.max(maxY, node.y + 40);
  }
  if (!isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 200, maxY: 200 };
  }
  return { minX, minY, maxX, maxY };
}

export function generateSVGString(state: Pick<DiagramState, 'nodes' | 'links' | 'solides'>): string {
  const padding = 30;
  const bounds = computeBounds(state.nodes);
  const width = bounds.maxX - bounds.minX + padding * 2;
  const height = bounds.maxY - bounds.minY + padding * 2;

  const linksSVG = Array.from(state.links.values())
    .map((link) => {
      const from = state.nodes.get(link.fromNodeId);
      const to = state.nodes.get(link.toNodeId);
      if (!from || !to) return '';
      return linkToSVG(link, from, to, state.solides);
    })
    .join('\n  ');

  const nodesSVG = Array.from(state.nodes.values())
    .map((node) => nodeToSVG(node))
    .join('\n  ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${bounds.minX - padding} ${bounds.minY - padding} ${width} ${height}">
  <rect x="${bounds.minX - padding}" y="${bounds.minY - padding}" width="${width}" height="${height}" fill="white"/>
  ${linksSVG}
  ${nodesSVG}
</svg>`;
}

export function exportSVG(state: Pick<DiagramState, 'nodes' | 'links' | 'solides'>) {
  const svg = generateSVGString(state);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = 'schema-cinematique.svg';
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
