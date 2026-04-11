import { useEffect } from 'react';
import { useDiagramStore } from '../store/diagramStore';
import { saveKineSketch } from '../export/kinesketch';
import { LIAISON_LIST } from '../liaisons';
import type { DiagramNode, Link } from '../types';

interface Clipboard {
  nodes: DiagramNode[];
  links: Link[];
}

// In-module clipboard. Lives at module scope so it survives unmounts the
// same way the previous top-level `let clipboard` in Editor.tsx did.
let clipboard: Clipboard | null = null;

interface UseKeyboardShortcutsOptions {
  zoomFit: () => void;
}

export function useKeyboardShortcuts({ zoomFit }: UseKeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const state = useDiagramStore.getState();
      const mod = e.ctrlKey || e.metaKey;

      // Ctrl+C — copy
      if (mod && e.key === 'c') {
        e.preventDefault();
        const selectedNodes = Array.from(state.selectedIds)
          .map((id) => state.nodes.get(id))
          .filter((n): n is DiagramNode => !!n);
        if (selectedNodes.length === 0) return;
        const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
        const selectedLinks = Array.from(state.links.values()).filter(
          (l) => selectedNodeIds.has(l.fromNodeId) && selectedNodeIds.has(l.toNodeId)
        );
        clipboard = { nodes: selectedNodes, links: selectedLinks };
        return;
      }

      // Ctrl+V — paste
      if (mod && e.key === 'v') {
        e.preventDefault();
        if (!clipboard || clipboard.nodes.length === 0) return;
        state.pasteNodes(clipboard.nodes, clipboard.links);
        // Update clipboard positions so subsequent pastes keep stepping
        clipboard = {
          nodes: clipboard.nodes.map((n) => ({ ...n, x: n.x + 40, y: n.y + 40 })),
          links: clipboard.links,
        };
        return;
      }

      // Ctrl+Z / Ctrl+Shift+Z — undo / redo
      if (mod && e.key === 'z') {
        e.preventDefault();
        const temporal = useDiagramStore.temporal.getState();
        if (e.shiftKey) temporal.redo();
        else temporal.undo();
        return;
      }

      // Ctrl+S — save
      if (mod && e.key === 's') {
        e.preventDefault();
        saveKineSketch(state);
        return;
      }

      // Delete / Backspace — selected midpoint or selection
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        if (state.selectedMidpoint) state.deleteSelectedMidpoint();
        else state.deleteSelected();
        return;
      }

      // Escape — deselect / cancel tool
      if (e.key === 'Escape') {
        state.clearSelection();
        state.setTool('select');
        return;
      }

      // Tool shortcuts
      if (e.key === 'v' || e.key === 'V') {
        state.setTool('select');
        return;
      }
      if (e.key === 'l' || e.key === 'L') {
        state.setTool('link');
        return;
      }

      // R — rotate selected nodes by 15° (Shift = -15°)
      if (e.key === 'r' || e.key === 'R') {
        const step = e.shiftKey ? -15 : 15;
        for (const id of state.selectedIds) {
          const node = state.nodes.get(id);
          if (node) state.rotateNode(id, (node.rotation + step) % 360);
        }
        return;
      }

      // Arrows — nudge selected nodes (Shift = fine 0.1)
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        if (state.selectedIds.size === 0) return;
        e.preventDefault();
        const step = e.shiftKey ? 0.1 : 1;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        const moves: Array<{ id: string; x: number; y: number }> = [];
        for (const id of state.selectedIds) {
          const node = state.nodes.get(id);
          if (node) moves.push({ id, x: node.x + dx, y: node.y + dy });
        }
        if (moves.length > 0) state.moveNodes(moves);
        return;
      }

      // F — zoom fit
      if (e.key === 'f' || e.key === 'F') {
        zoomFit();
        return;
      }

      // 1-9 — toggle a liaison from the palette
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 9 && num <= LIAISON_LIST.length) {
        const def = LIAISON_LIST[num - 1];
        state.setPlacingLiaison(
          state.placingLiaison?.type === def.type ? null : { type: def.type, view: 1 }
        );
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomFit]);
}
