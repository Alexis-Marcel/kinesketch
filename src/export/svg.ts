import type { DiagramNode, DiagramState, Link, Solide } from '../types';
import { CELL } from '../utils/snap';

function nodeToSVG(node: DiagramNode): string {
  const transform = `translate(${node.x * CELL}, ${node.y * CELL}) rotate(${node.rotation})`;
  const stroke = '#1a1a1a';
  const sw = 2;
  const view = node.view ?? 1;

  switch (node.type) {
    case 'pivot':
      if (view === 2) {
        return `<g transform="${transform}">
        <circle r="12" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="0" y1="-20" x2="0" y2="20" stroke="${stroke}" stroke-width="${sw}"/>
        <circle r="2.5" fill="${stroke}"/>
        ${labelSVG(node)}
      </g>`;
      }
      return `<g transform="${transform}">
        <rect x="-15" y="-10" width="30" height="20" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-25" y1="0" x2="25" y2="0" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-25" y1="-8" x2="-25" y2="8" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="25" y1="-8" x2="25" y2="8" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;

    case 'glissiere':
      if (view === 2) {
        return `<g transform="${transform}">
        <rect x="-15" y="-9" width="30" height="18" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-15" y1="-9" x2="15" y2="9" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="15" y1="-9" x2="-15" y2="9" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;
      }
      return `<g transform="${transform}">
        <rect x="-15" y="-9" width="30" height="18" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-29" y1="-13" x2="29" y2="-13" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-29" y1="13" x2="29" y2="13" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;

    case 'pivot_glissant':
      if (view === 2) {
        return `<g transform="${transform}">
        <circle r="10" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-7" y1="-7" x2="7" y2="7" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="7" y1="-7" x2="-7" y2="7" stroke="${stroke}" stroke-width="${sw}"/>
        <circle r="2.5" fill="${stroke}"/>
        ${labelSVG(node)}
      </g>`;
      }
      return `<g transform="${transform}">
        <rect x="-15" y="-12" width="30" height="24" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-29" y1="-16" x2="29" y2="-16" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-29" y1="16" x2="29" y2="16" stroke="${stroke}" stroke-width="${sw}"/>
        <circle r="10" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <circle r="2.5" fill="${stroke}"/>
        ${labelSVG(node)}
      </g>`;

    case 'rotule':
      if (view === 2) {
        return `<g transform="${transform}">
        <circle r="14" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-18" y1="14" x2="18" y2="14" stroke="${stroke}" stroke-width="${sw}"/>
        <circle r="2.5" fill="${stroke}"/>
        ${labelSVG(node)}
      </g>`;
      }
      return `<g transform="${transform}">
        <circle r="14" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="0" y1="-14" x2="0" y2="14" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-14" y1="0" x2="14" y2="0" stroke="${stroke}" stroke-width="${sw}"/>
        <circle r="2.5" fill="${stroke}"/>
        ${labelSVG(node)}
      </g>`;

    case 'encastrement': {
      if (view === 2) {
        const hatches = [];
        const count = Math.floor(36 / 6);
        for (let i = 0; i <= count; i++) {
          const yPos = -18 + i * 6;
          hatches.push(`<line x1="-5" y1="${yPos}" x2="-13" y2="${yPos - 4}" stroke="${stroke}" stroke-width="1.5"/>`);
        }
        return `<g transform="${transform}">
        <rect x="-5" y="-18" width="10" height="36" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        ${hatches.join('\n        ')}
        <line x1="5" y1="0" x2="15" y2="0" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;
      }
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
      if (view === 2) {
        return `<g transform="${transform}">
        <rect x="-15" y="-9" width="30" height="18" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-15" y1="-9" x2="15" y2="9" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="15" y1="-9" x2="-15" y2="9" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="15" y1="-4" x2="21" y2="4" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="21" y1="4" x2="18" y2="6" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;
      }
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
      if (view === 2) {
        return `<g transform="${transform}">
        <circle r="${r}" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="${-r}" y1="0" x2="${r}" y2="0" stroke="${stroke}" stroke-width="${sw}"/>
        <circle r="2.5" fill="${stroke}"/>
        ${labelSVG(node)}
      </g>`;
      }
      return `<g transform="${transform}">
        <circle r="${r}" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="0" y1="${-r}" x2="0" y2="${r}" stroke="${stroke}" stroke-width="${sw}"/>
        <circle r="2.5" fill="${stroke}"/>
        ${labelSVG(node)}
      </g>`;
    }

    case 'appui_plan': {
      if (view === 2) {
        const hatches = [];
        for (let i = 0; i <= 7; i++) {
          const yPos = -18 + i * (36 / 7);
          hatches.push(`<line x1="0" y1="${yPos.toFixed(1)}" x2="-8" y2="${(yPos - 5).toFixed(1)}" stroke="${stroke}" stroke-width="1.5"/>`);
        }
        return `<g transform="${transform}">
        <line x1="0" y1="-18" x2="0" y2="18" stroke="${stroke}" stroke-width="${sw}"/>
        ${hatches.join('\n        ')}
        <line x1="16" y1="0" x2="0" y2="0" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;
      }
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
      if (view === 2) {
        return `<g transform="${transform}">
        <line x1="-20" y1="-12" x2="20" y2="-12" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-20" y1="12" x2="20" y2="12" stroke="${stroke}" stroke-width="${sw}"/>
        <circle r="2.5" fill="${stroke}"/>
        ${labelSVG(node)}
      </g>`;
      }
      const r = 12;
      return `<g transform="${transform}">
        <circle r="${r}" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="0" y1="${-(r + 8)}" x2="0" y2="${r + 8}" stroke="${stroke}" stroke-width="${sw}"/>
        <circle r="2.5" fill="${stroke}"/>
        ${labelSVG(node)}
      </g>`;
    }

    case 'lineaire_rectiligne': {
      if (view === 2) {
        const hatches = [];
        for (let i = 0; i < 7; i++) {
          const xPos = -18 + i * 6;
          hatches.push(`<line x1="${xPos}" y1="4" x2="${xPos - 4}" y2="12" stroke="${stroke}" stroke-width="1.5"/>`);
        }
        return `<g transform="${transform}">
        <line x1="-18" y1="-4" x2="18" y2="-4" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-18" y1="4" x2="18" y2="4" stroke="${stroke}" stroke-width="${sw}"/>
        ${hatches.join('\n        ')}
        ${labelSVG(node)}
      </g>`;
      }
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
      if (view === 2) {
        return `<g transform="${transform}">
        <circle cy="-4" r="4" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-18" y1="0" x2="18" y2="0" stroke="${stroke}" stroke-width="${sw}"/>
        ${hatches.join('\n        ')}
        <line x1="0" y1="-8" x2="0" y2="-16" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;
      }
      return `<g transform="${transform}">
        <circle cy="-4" r="4" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-18" y1="0" x2="18" y2="0" stroke="${stroke}" stroke-width="${sw}"/>
        ${hatches.join('\n        ')}
        ${labelSVG(node)}
      </g>`;
    }

    case 'bati': {
      const batiHatches = [];
      for (const offset of [-16, -10, -4, 2, 8, 14]) {
        batiHatches.push(`<line x1="${offset}" y1="0" x2="${offset - 7}" y2="8" stroke="${stroke}" stroke-width="1.2"/>`);
      }
      return `<g transform="${transform}">
        <line x1="-22" y1="0" x2="22" y2="0" stroke="${stroke}" stroke-width="${sw}"/>
        ${batiHatches.join('\n        ')}
        ${labelSVG(node)}
      </g>`;
    }

    case 'engrenage_ext':
      if (view === 2) {
        return `<g transform="${transform}">
        <circle cy="-8" r="8" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <circle cy="14" r="14" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;
      }
      return `<g transform="${transform}">
        <line x1="0" y1="-16" x2="0" y2="24" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-8" y1="-16" x2="8" y2="-16" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-8" y1="0" x2="8" y2="0" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-8" y1="24" x2="8" y2="24" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;

    case 'engrenage_int':
      if (view === 2) {
        return `<g transform="${transform}">
        <circle r="14" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <circle cy="-8" r="6" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;
      }
      return `<g transform="${transform}">
        <line x1="0" y1="-16" x2="0" y2="24" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-8" y1="-16" x2="8" y2="-16" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-8" y1="0" x2="8" y2="0" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="8" y1="-16" x2="8" y2="24" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="8" y1="-16" x2="14" y2="-16" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="8" y1="24" x2="14" y2="24" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;

    case 'engrenage_conique':
      if (view === 2) {
        return `<g transform="${transform}">
        <circle r="14" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;
      }
      return `<g transform="${transform}">
        <line x1="0" y1="-20" x2="0" y2="20" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-6" y1="-14" x2="6" y2="-26" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-6" y1="6" x2="6" y2="-6" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-6" y1="26" x2="6" y2="14" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;

    case 'roue_vis_sans_fin':
      if (view === 2) {
        return `<g transform="${transform}">
        <rect x="-35" y="-75" width="70" height="34" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-5" y1="-63" x2="5" y2="-53" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-5" y1="-53" x2="5" y2="-63" stroke="${stroke}" stroke-width="${sw}"/>
        <circle cy="17" r="58" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;
      }
      return `<g transform="${transform}">
        <circle cy="-62" r="20" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <path d="M 12.46 -39.19 A 26 26 0 0 0 -12.46 -39.19" fill="none" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="0" y1="-36" x2="0" y2="78" stroke="${stroke}" stroke-width="${sw}"/>
        <path d="M -12.46 81.19 A 26 26 0 0 0 12.46 81.19" fill="none" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;

    case 'transmission_poulie_courroie': {
      const beltColor = '#22c55e';
      if (view === 2) {
        return `<g transform="${transform}">
        <line x1="-90" y1="-36" x2="66" y2="-60" stroke="${beltColor}" stroke-width="${sw}"/>
        <line x1="-90" y1="36" x2="66" y2="60" stroke="${beltColor}" stroke-width="${sw}"/>
        <circle cx="-90" cy="0" r="36" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <circle cx="66" cy="0" r="60" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;
      }
      return `<g transform="${transform}">
        <polyline points="-126,9 -126,-9 -54,-9 -54,9" fill="none" stroke="${stroke}" stroke-width="${sw}"/>
        <polyline points="6,9 6,-9 126,-9 126,9" fill="none" stroke="${stroke}" stroke-width="${sw}"/>
        <line x1="-126" y1="-3" x2="126" y2="-3" stroke="${beltColor}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;
    }

    case 'transmission_pignons_chaine': {
      const chainColor = '#22c55e';
      if (view === 2) {
        return `<g transform="${transform}">
        <line x1="-90" y1="-36" x2="66" y2="-60" stroke="${chainColor}" stroke-width="${sw}" stroke-dasharray="6,4"/>
        <line x1="-90" y1="36" x2="66" y2="60" stroke="${chainColor}" stroke-width="${sw}" stroke-dasharray="6,4"/>
        <circle cx="-90" cy="0" r="36" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        <circle cx="66" cy="0" r="60" fill="white" stroke="${stroke}" stroke-width="${sw}"/>
        ${labelSVG(node)}
      </g>`;
      }
      return `<g transform="${transform}">
        <line x1="-54" y1="0" x2="6" y2="0" stroke="${chainColor}" stroke-width="${sw}" stroke-dasharray="6,4"/>
        <line x1="-126" y1="0" x2="-54" y2="0" stroke="${stroke}" stroke-width="${sw}"/>
        <polygon points="-126,0 -120,-3 -120,3" fill="${stroke}"/>
        <polygon points="-54,0 -60,-3 -60,3" fill="${stroke}"/>
        <line x1="6" y1="0" x2="126" y2="0" stroke="${stroke}" stroke-width="${sw}"/>
        <polygon points="6,0 12,-3 12,3" fill="${stroke}"/>
        <polygon points="126,0 120,-3 120,3" fill="${stroke}"/>
        ${labelSVG(node)}
      </g>`;
    }
  }
  return '';
}

function labelSVG(node: DiagramNode): string {
  if (!node.label) return '';
  return `<text x="20" y="-16" font-size="13" font-family="Inter,system-ui,sans-serif" fill="#374151">${escapeXml(node.label)}</text>`;
}

function linkToSVG(link: Link, from: DiagramNode, to: DiagramNode, solides: Map<string, Solide>): string {
  const solide = solides.get(link.solideId);
  const color = solide?.color || '#4b5563';
  const fx = from.x * CELL, fy = from.y * CELL, tx = to.x * CELL, ty = to.y * CELL;
  const midX = (fx + tx) / 2;
  const midY = (fy + ty) / 2;
  return `<g>
    <line x1="${fx}" y1="${fy}" x2="${tx}" y2="${ty}" stroke="${color}" stroke-width="2"/>
    ${link.label ? `<text x="${midX + 8}" y="${midY - 10}" font-size="13" font-family="Inter,system-ui,sans-serif" fill="${color}">${escapeXml(link.label)}</text>` : ''}
  </g>`;
}

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function computeBounds(nodes: Map<string, DiagramNode>): { minX: number; minY: number; maxX: number; maxY: number } {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const node of nodes.values()) {
    const px = node.x * CELL, py = node.y * CELL;
    minX = Math.min(minX, px - 40);
    minY = Math.min(minY, py - 40);
    maxX = Math.max(maxX, px + 40);
    maxY = Math.max(maxY, py + 40);
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
