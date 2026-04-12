import { Circle, Group, Line, Rect } from 'react-konva';
import type Konva from 'konva';
import type { DiagramNode, Link } from '../types';
import { anchorToWorld, getAnchors } from '../utils/anchors';
import { CELL } from '../utils/snap';
import { getLiaisonBounds } from '../liaisons/bounds';
import { AnchorMarker } from './AnchorMarker';

// ---------------------------------------------------------------------------
// Ghost line — unified component for BOTH link creation (dashed blue line
// following the cursor) AND reanchoring (solid line in the link's actual
// color with midpoints). Uses resolveEndpoint for the fixed end so
// T-junction endpoints work correctly.
// ---------------------------------------------------------------------------

interface GhostLineProps {
  /** Position of the moving end (cursor). */
  mousePos: { x: number; y: number };
  /** The fixed end — either computed from a link's existing endpoint or from a source node. */
  fixedPos: { x: number; y: number };
  /** Midpoints between fixed and moving ends (in pixels). */
  midpointsPx?: number[];
  /** Which side is the mouse on? Determines point order. */
  mouseSide: 'from' | 'to';
  /** Line color. */
  color: string;
  /** Line width. */
  strokeWidth?: number;
  /** Whether to dash the line (creation mode). */
  dashed?: boolean;
  /** Opacity. */
  opacity?: number;
}

export function GhostLine({
  mousePos,
  fixedPos,
  midpointsPx,
  mouseSide,
  color,
  strokeWidth: sw = 1.5,
  dashed,
  opacity,
}: GhostLineProps) {
  const mps = midpointsPx ?? [];
  const points: number[] = mouseSide === 'from'
    ? [mousePos.x, mousePos.y, ...mps, fixedPos.x, fixedPos.y]
    : [fixedPos.x, fixedPos.y, ...mps, mousePos.x, mousePos.y];
  return (
    <Group listening={false}>
      <Line
        points={points}
        stroke={color}
        strokeWidth={sw}
        {...(dashed ? { dash: [8, 4] } : {})}
        {...(opacity !== undefined ? { opacity } : {})}
      />
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
            nodeRotation={hoverNode.rotation}
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
          nodeRotation={node.rotation}
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

