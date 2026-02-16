export type LiaisonType =
  | 'pivot'
  | 'glissiere'
  | 'pivot_glissant'
  | 'rotule'
  | 'encastrement'
  | 'helicoidale'
  | 'rotule_doigt'
  | 'appui_plan'
  | 'lineaire_annulaire'
  | 'lineaire_rectiligne'
  | 'ponctuelle';

export type ToolType = 'move' | 'select' | 'place' | 'link';

export interface Solide {
  id: string;
  name: string;
  color: string;
  isBati: boolean;
}

export interface DiagramNode {
  id: string;
  type: LiaisonType;
  x: number;
  y: number;
  rotation: number;
  label: string;
  labelOffsetX: number;
  labelOffsetY: number;
}

export interface Link {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  solideId: string;
  label: string;
  labelOffsetX: number;
  labelOffsetY: number;
}

export interface DiagramData {
  nodes: Map<string, DiagramNode>;
  links: Map<string, Link>;
  solides: Map<string, Solide>;
}

export interface DiagramState extends DiagramData {
  // UI state (not persisted in undo history)
  selectedIds: Set<string>;
  activeTool: ToolType;
  placingLiaison: LiaisonType | null;
  linkSourceId: string | null;
  activeSolideId: string | null;

  // Canvas view
  stageX: number;
  stageY: number;
  stageScale: number;

  // Node actions
  addNode: (type: LiaisonType, x: number, y: number) => void;
  moveNode: (id: string, x: number, y: number) => void;
  moveNodes: (moves: Array<{ id: string; x: number; y: number }>) => void;
  rotateNode: (id: string, rotation: number) => void;
  deleteNode: (id: string) => void;
  updateNodeLabel: (id: string, label: string) => void;
  updateNodeLabelOffset: (id: string, ox: number, oy: number) => void;

  // Link actions
  addLink: (fromNodeId: string, toNodeId: string) => void;
  deleteLink: (id: string) => void;
  updateLinkLabel: (id: string, label: string) => void;
  updateLinkLabelOffset: (id: string, ox: number, oy: number) => void;
  updateLinkSolide: (id: string, solideId: string) => void;

  // Solide actions
  addSolide: (isBati?: boolean) => string;
  deleteSolide: (id: string) => void;
  setActiveSolide: (id: string | null) => void;
  updateSolideColor: (id: string, color: string) => void;
  updateSolideName: (id: string, name: string) => void;

  // Selection
  select: (id: string) => void;
  selectMultiple: (ids: string[]) => void;
  clearSelection: () => void;
  deleteSelected: () => void;

  // Tools
  setTool: (tool: ToolType) => void;
  setPlacingLiaison: (type: LiaisonType | null) => void;
  setLinkSource: (id: string | null) => void;

  // Canvas
  setStagePosition: (x: number, y: number) => void;
  setStageScale: (scale: number) => void;

  // Bulk
  pasteNodes: (sourceNodes: DiagramNode[], sourceLinks: Link[]) => void;
  loadDiagram: (data: { nodes: Map<string, DiagramNode>; links: Map<string, Link>; solides: Map<string, Solide> }) => void;
  clearDiagram: () => void;
}

export interface KineSketchFile {
  version: string;
  name: string;
  nodes: Array<DiagramNode>;
  links: Array<Link>;
  solides: Array<Solide>;
  canvas: {
    x: number;
    y: number;
    scale: number;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
  };
}

export interface LiaisonDefinition {
  type: LiaisonType;
  name: string;
  dof: number;
  description: string;
}
