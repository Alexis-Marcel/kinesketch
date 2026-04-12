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
  | 'ponctuelle'
  | 'bati'
  | 'engrenage_ext'
  | 'engrenage_int'
  | 'engrenage_conique'
  | 'roue_vis_sans_fin'
  | 'transmission_poulie_courroie'
  | 'transmission_pignons_chaine';

export type LiaisonView = 1 | 2 | 3;

/**
 * A frozen position on a shape anchor — captured when the user clicks a
 * specific spot. Stored on the link so the attachment point stays put even
 * when the other end of the link moves. Coordinates are in the node's LOCAL
 * frame so node rotation/scale is applied automatically.
 */
export type AnchorOffset = { kind: 'circle'; angle: number };

export type LinkRoutingMode = 'direct' | 'ortho' | 'ortho-persp';
export type LinkLineStyle = 'solid' | 'dashed' | 'dotted';
export type ArrowMarker = 'none' | 'triangle' | 'chevron';

export type ToolType = 'select' | 'place' | 'link';

export type DiagramDimension = '2d' | '3d';

export interface Solide {
  id: string;
  name: string;
  color: string;
  isBati: boolean;
  // Local reference frame (optional)
  showFrame?: boolean;
  frameX?: number;
  frameY?: number;
  frameRotation?: number;
  frameLabel?: string;
}

export interface DiagramNode {
  id: string;
  type: LiaisonType;
  view: LiaisonView;
  x: number;
  y: number;
  z: number;
  rotation: number;
  rotationX: number;
  rotationY: number;
  scale: number;
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
  fromAnchorIdx?: number;
  toAnchorIdx?: number;
  /**
   * Captured offset on the from-end shape anchor (e.g. an angle on a circle).
   * When set, the attachment point stays fixed at that exact spot on the shape
   * regardless of where the other end of the link moves. When undefined, the
   * attachment slides dynamically toward the other end (default).
   */
  fromAnchorOffset?: AnchorOffset;
  toAnchorOffset?: AnchorOffset;
  midpoints?: Array<{ x: number; y: number; z?: number }>;
  routingMode?: LinkRoutingMode;
  lineStyle?: LinkLineStyle;
  arrowStart?: ArrowMarker;
  arrowEnd?: ArrowMarker;
  /** T-junction: this end attaches to a point on another link instead of a node. */
  fromLinkId?: string;
  fromLinkT?: number;
  toLinkId?: string;
  toLinkT?: number;
}

export interface AngleArc {
  id: string;
  fromSolideId: string;
  toSolideId: string;
  label: string;
  radius: number;
  x: number;
  y: number;
  labelOffsetX: number;
  labelOffsetY: number;
}

export interface DiagramData {
  nodes: Map<string, DiagramNode>;
  links: Map<string, Link>;
  solides: Map<string, Solide>;
  angleArcs: Map<string, AngleArc>;
}

export interface DiagramState extends DiagramData {
  // Diagram dimension
  dimension: DiagramDimension;

  // UI state (not persisted in undo history)
  selectedIds: Set<string>;
  activeTool: ToolType;
  placingLiaison: { type: LiaisonType; view: LiaisonView } | null;
  linkSourceId: string | null;
  activeSolideId: string | null;
  selectedMidpoint: { linkId: string; index: number } | null;

  // Canvas view
  stageX: number;
  stageY: number;
  stageScale: number;

  // Dimension
  setDimension: (dim: DiagramDimension) => void;

  // Node actions
  addNode: (type: LiaisonType, x: number, y: number, view?: LiaisonView, z?: number) => void;
  moveNode: (id: string, x: number, y: number, z?: number) => void;
  moveNodes: (moves: Array<{ id: string; x: number; y: number; z?: number }>) => void;
  rotateNode: (id: string, rotation: number, rotationX?: number, rotationY?: number) => void;
  scaleNode: (id: string, scale: number) => void;
  deleteNode: (id: string) => void;
  updateNodeLabel: (id: string, label: string) => void;
  updateNodeView: (id: string, view: LiaisonView) => void;
  updateNodeLabelOffset: (id: string, ox: number, oy: number) => void;

  // Link actions
  addLink: (
    fromNodeId: string,
    toNodeId: string,
    fromAnchorIdx?: number,
    toAnchorIdx?: number,
    fromAnchorOffset?: AnchorOffset,
    toAnchorOffset?: AnchorOffset
  ) => void;
  deleteLink: (id: string) => void;
  updateLinkLabel: (id: string, label: string) => void;
  updateLinkLabelOffset: (id: string, ox: number, oy: number) => void;
  updateLinkSolide: (id: string, solideId: string) => void;
  updateLinkRouting: (id: string, mode: LinkRoutingMode) => void;
  updateLinkLineStyle: (id: string, style: LinkLineStyle) => void;
  updateLinkArrows: (id: string, arrowStart: ArrowMarker, arrowEnd: ArrowMarker) => void;
  addLinkToLink: (
    fromNodeId: string,
    toLinkId: string,
    toLinkT: number,
    fromAnchorIdx?: number,
    fromAnchorOffset?: AnchorOffset
  ) => void;
  reanchorLinkToLink: (id: string, end: 'from' | 'to', targetLinkId: string, t: number) => void;
  updateLinkAnchor: (id: string, end: 'from' | 'to', anchorIdx: number, offset?: AnchorOffset) => void;
  reanchorLink: (id: string, end: 'from' | 'to', newNodeId: string, anchorIdx: number, offset?: AnchorOffset) => void;
  updateLinkMidpoints: (id: string, midpoints: Array<{ x: number; y: number }>) => void;

  // Solide actions
  addSolide: (isBati?: boolean) => string;
  deleteSolide: (id: string) => void;
  setActiveSolide: (id: string | null) => void;
  updateSolideColor: (id: string, color: string) => void;
  updateSolideName: (id: string, name: string) => void;

  // Frame actions
  toggleSolideFrame: (id: string) => void;
  moveSolideFrame: (id: string, x: number, y: number) => void;
  rotateSolideFrame: (id: string, rotation: number) => void;
  updateSolideFrameLabel: (id: string, label: string) => void;

  // Angle arc actions
  addAngleArc: (fromSolideId: string, toSolideId: string, x: number, y: number) => void;
  deleteAngleArc: (id: string) => void;
  moveAngleArc: (id: string, x: number, y: number) => void;
  updateAngleArcLabel: (id: string, label: string) => void;
  updateAngleArcLabelOffset: (id: string, ox: number, oy: number) => void;

  // Selection
  select: (id: string) => void;
  selectMultiple: (ids: string[]) => void;
  clearSelection: () => void;
  deleteSelected: () => void;
  selectMidpoint: (linkId: string, index: number) => void;
  clearMidpointSelection: () => void;
  deleteSelectedMidpoint: () => void;

  // Tools
  setTool: (tool: ToolType) => void;
  setPlacingLiaison: (info: { type: LiaisonType; view: LiaisonView } | null) => void;
  setLinkSource: (id: string | null) => void;

  // Canvas
  setStagePosition: (x: number, y: number) => void;
  setStageScale: (scale: number) => void;

  // Bulk
  pasteNodes: (sourceNodes: DiagramNode[], sourceLinks: Link[]) => void;
  loadDiagram: (data: { nodes: Map<string, DiagramNode>; links: Map<string, Link>; solides: Map<string, Solide>; angleArcs?: Map<string, AngleArc> }) => void;
  clearDiagram: () => void;
}

export interface KineSketchFile {
  version: string;
  name: string;
  dimension: DiagramDimension;
  nodes: Array<DiagramNode>;
  links: Array<Link>;
  solides: Array<Solide>;
  angleArcs?: Array<AngleArc>;
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
  viewCount: 1 | 2 | 3;
}
