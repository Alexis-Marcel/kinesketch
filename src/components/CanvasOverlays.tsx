import { Circle, Group, Line, Rect } from 'react-konva';
import type Konva from 'konva';
import type { AnchorOffset, DiagramNode, Link, Solide } from '../types';
import {
  anchorToWorld,
  getAnchors,
  getBestAnchor,
  type SolideMapping,
} from '../utils/anchors';
import { getLiaisonBounds } from '../liaisons/bounds';
import { CELL } from '../utils/snap';
import { AnchorMarker } from './AnchorMarker';

// ---------------------------------------------------------------------------
// Ghost link line — dashed blue line that follows the cursor while the user
// is actively creating a new link.
// ---------------------------------------------------------------------------

interface LinkGhostLineProps {
  sourceNode: DiagramNode;
  mousePos: { x: number; y: number };
  activeSolideId: string | null;
  sourceMapping: SolideMapping;
  sourceAnchorIdx: number | undefined;
  sourceAnchorOffset: AnchorOffset | undefined;
}

export function LinkGhostLine({
  sourceNode,
  mousePos,
  activeSolideId,
  sourceMapping,
  sourceAnchorIdx,
  sourceAnchorOffset,
}: LinkGhostLineProps) {
  const fromAnchor = getBestAnchor(
    sourceNode,
    mousePos,
    activeSolideId,
    sourceMapping,
    sourceAnchorIdx,
    sourceAnchorOffset
  );
  return (
    <Group listening={false}>
      <Line
        points={[fromAnchor.x, fromAnchor.y, mousePos.x, mousePos.y]}
        stroke="#2563eb"
        strokeWidth={2}
        dash={[8, 4]}
        opacity={0.6}
      />
    </Group>
  );
}

// ---------------------------------------------------------------------------
// Reanchor ghost line — solid line in the link's actual color that follows
// the cursor as the user drags one end of an existing link to a new anchor.
// ---------------------------------------------------------------------------

interface ReanchorGhostLineProps {
  link: Link;
  end: 'from' | 'to';
  mousePos: { x: number; y: number };
  nodes: Map<string, DiagramNode>;
  solides: Map<string, Solide>;
  nodeSolideMapping: Map<string, SolideMapping>;
}

export function ReanchorGhostLine({
  link,
  end,
  mousePos,
  nodes,
  solides,
  nodeSolideMapping,
}: ReanchorGhostLineProps) {
  const linkColor = solides.get(link.solideId)?.color || '#4b5563';
  const fixedNodeId = end === 'from' ? link.toNodeId : link.fromNodeId;
  const fixedAnchorIdx = end === 'from' ? link.toAnchorIdx : link.fromAnchorIdx;
  const fixedAnchorOffset = end === 'from' ? link.toAnchorOffset : link.fromAnchorOffset;
  const fixedNode = nodes.get(fixedNodeId);
  if (!fixedNode) return null;
  const fixedMapping = nodeSolideMapping.get(fixedNodeId) || { a: null, b: null };
  const fixedPos = getBestAnchor(fixedNode, mousePos, link.solideId, fixedMapping, fixedAnchorIdx, fixedAnchorOffset);
  const mps = link.midpoints || [];
  const points: number[] = end === 'from'
    ? [mousePos.x, mousePos.y, ...mps.flatMap((p) => [p.x, p.y]), fixedPos.x, fixedPos.y]
    : [fixedPos.x, fixedPos.y, ...mps.flatMap((p) => [p.x, p.y]), mousePos.x, mousePos.y];
  return (
    <Group listening={false}>
      <Line points={points} stroke={linkColor} strokeWidth={1.5} />
    </Group>
  );
}

// ---------------------------------------------------------------------------
// Anchor markers shown on the currently-hovered node in link mode (or while
// reanchoring). The active marker is the one we'd snap to on click.
// ---------------------------------------------------------------------------

interface HoverAnchorMarkersProps {
  hoverNode: DiagramNode;
  isTarget: boolean;
  targetAnchorIdx: number | undefined;
  /** Click handler for link mode (not used while reanchoring). */
  onAnchorClick?: (anchorIdx: number) => void;
}

export function HoverAnchorMarkers({
  hoverNode,
  isTarget,
  targetAnchorIdx,
  onAnchorClick,
}: HoverAnchorMarkersProps) {
  const anchors = getAnchors(hoverNode.type, hoverNode.view);
  const nodeScale = hoverNode.scale ?? 1;
  return (
    <>
      {anchors.map((anchor, i) => {
        const world = anchorToWorld(anchor, hoverNode.x * CELL, hoverNode.y * CELL, hoverNode.rotation, nodeScale);
        return (
          <AnchorMarker
            key={`hover-${i}`}
            anchor={anchor}
            centerX={world.x}
            centerY={world.y}
            scale={nodeScale}
            isActive={isTarget && targetAnchorIdx === i}
            dotRadius={onAnchorClick ? 3 : 4}
            onClick={onAnchorClick
              ? (e) => { e.cancelBubble = true; onAnchorClick(i); }
              : undefined}
          />
        );
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Anchor markers shown on both nodes of a selected link, so the user can
// click-and-drag any of them to start reanchoring that end of the link.
// ---------------------------------------------------------------------------

interface SelectedLinkAnchorsProps {
  link: Link;
  fromNode: DiagramNode;
  toNode: DiagramNode;
  onStartReanchor: (linkId: string, end: 'from' | 'to') => void;
}

export function SelectedLinkAnchors({
  link,
  fromNode,
  toNode,
  onStartReanchor,
}: SelectedLinkAnchorsProps) {
  const renderSide = (
    node: DiagramNode,
    end: 'from' | 'to',
    activeIdx: number | undefined,
    keyPrefix: string
  ) => {
    const anchors = getAnchors(node.type, node.view);
    const scale = node.scale ?? 1;
    return anchors.map((anchor, i) => {
      const world = anchorToWorld(anchor, node.x * CELL, node.y * CELL, node.rotation, scale);
      return (
        <AnchorMarker
          key={`${keyPrefix}-${link.id}-${i}`}
          anchor={anchor}
          centerX={world.x}
          centerY={world.y}
          scale={scale}
          isActive={activeIdx === i}
          onMouseDown={(e) => {
            e.cancelBubble = true;
            onStartReanchor(link.id, end);
          }}
        />
      );
    });
  };

  return (
    <>
      {renderSide(fromNode, 'from', link.fromAnchorIdx, 'sel-link-from')}
      {renderSide(toNode, 'to', link.toAnchorIdx, 'sel-link-to')}
    </>
  );
}

// ---------------------------------------------------------------------------
// Selection rectangle — drawn while the user drags an empty area to box-
// select multiple nodes.
// ---------------------------------------------------------------------------

interface SelectionRectProps {
  rect: { x1: number; y1: number; x2: number; y2: number };
  stageScale: number;
}

export function SelectionRect({ rect, stageScale }: SelectionRectProps) {
  const x = Math.min(rect.x1, rect.x2);
  const y = Math.min(rect.y1, rect.y2);
  const w = Math.abs(rect.x2 - rect.x1);
  const h = Math.abs(rect.y2 - rect.y1);
  return (
    <Rect
      x={x}
      y={y}
      width={w}
      height={h}
      fill="rgba(37, 99, 235, 0.08)"
      stroke="#2563eb"
      strokeWidth={1 / stageScale}
      dash={[6 / stageScale, 3 / stageScale]}
      listening={false}
    />
  );
}

// ---------------------------------------------------------------------------
// Snap point dot — small blue marker at the exact spot a link will attach
// when the user clicks on a circle-shape anchor.
// ---------------------------------------------------------------------------

export function SnapPointDot({ pos }: { pos: { x: number; y: number } }) {
  return (
    <Circle
      x={pos.x}
      y={pos.y}
      radius={4}
      fill="#2563eb"
      stroke="#ffffff"
      strokeWidth={1.5}
      listening={false}
    />
  );
}

// ---------------------------------------------------------------------------
// Dashed bounding-box outline drawn around each selected node.
// ---------------------------------------------------------------------------

interface SelectionOutlineProps {
  node: DiagramNode;
  stageScale: number;
}

export function SelectionOutline({ node, stageScale }: SelectionOutlineProps) {
  const s = node.scale ?? 1;
  const { halfW, halfH } = getLiaisonBounds(node.type, node.view);
  const padW = halfW * s;
  const padH = halfH * s;
  return (
    <Group x={node.x * CELL} y={node.y * CELL} rotation={node.rotation} listening={false}>
      <Rect
        x={-padW}
        y={-padH}
        width={padW * 2}
        height={padH * 2}
        stroke="#2563eb"
        strokeWidth={1.2 / stageScale}
        dash={[5 / stageScale, 3 / stageScale]}
        cornerRadius={3 / stageScale}
      />
    </Group>
  );
}

// ---------------------------------------------------------------------------
// Resize handles (corner squares) + rotation handle (top circle) for the
// single selected node.
// ---------------------------------------------------------------------------

interface TransformHandlesProps {
  node: DiagramNode;
  stageScale: number;
  onScaleStart: (nodeId: string, e: Konva.KonvaEventObject<MouseEvent>) => void;
  onRotateStart: (nodeId: string, e: Konva.KonvaEventObject<MouseEvent>) => void;
}

export function TransformHandles({ node, stageScale, onScaleStart, onRotateStart }: TransformHandlesProps) {
  const s = node.scale ?? 1;
  const { halfW, halfH } = getLiaisonBounds(node.type, node.view);
  const padW = halfW * s;
  const padH = halfH * s;
  const rad = (node.rotation * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const handleSize = 6 / stageScale;
  const corners = [
    { lx: padW, ly: padH },
    { lx: -padW, ly: padH },
    { lx: -padW, ly: -padH },
    { lx: padW, ly: -padH },
  ];

  // Rotation handle — sits above the bounding box along the node's local +Y.
  const rotHandleDist = (halfH + 18) * s;
  const hx = node.x * CELL + rotHandleDist * Math.sin(rad);
  const hy = node.y * CELL - rotHandleDist * Math.cos(rad);
  const edgeX = node.x * CELL + padH * Math.sin(rad);
  const edgeY = node.y * CELL - padH * Math.cos(rad);

  return (
    <>
      {corners.map((c, i) => {
        const wx = node.x * CELL + c.lx * cos - c.ly * sin;
        const wy = node.y * CELL + c.lx * sin + c.ly * cos;
        return (
          <Rect
            key={`resize-${i}`}
            x={wx - handleSize / 2}
            y={wy - handleSize / 2}
            width={handleSize}
            height={handleSize}
            fill="white"
            stroke="#2563eb"
            strokeWidth={1.2 / stageScale}
            onMouseDown={(e) => onScaleStart(node.id, e)}
          />
        );
      })}
      <Group>
        <Line
          points={[edgeX, edgeY, hx, hy]}
          stroke="#2563eb"
          strokeWidth={1 / stageScale}
          listening={false}
        />
        <Circle
          x={hx}
          y={hy}
          radius={7 / stageScale}
          fill="white"
          stroke="#2563eb"
          strokeWidth={1.5 / stageScale}
          onMouseDown={(e) => onRotateStart(node.id, e)}
        />
        <Line
          points={[
            hx + (4 / stageScale) * Math.cos(rad),
            hy + (4 / stageScale) * Math.sin(rad),
            hx,
            hy - 5 / stageScale,
            hx - (4 / stageScale) * Math.cos(rad),
            hy - (4 / stageScale) * Math.sin(rad),
          ]}
          stroke="#2563eb"
          strokeWidth={1 / stageScale}
          listening={false}
        />
      </Group>
    </>
  );
}

