'use client';

import React from 'react';
import { Group, Line, Shape, Circle, Text } from 'react-konva';
import type Konva from 'konva';
import { useDiagramStore } from '../store/diagramStore';
import type { DiagramNode, Link } from '../types';
import { getBestAnchor, type SolideMapping } from '../utils/anchors';
import { snapPx, CELL } from '../utils/snap';
import { computeOrthoRoute } from '../utils/orthoRouter';

/**
 * Return one half of a polyline split at its length-based midpoint.
 * `'from'` keeps the start..midpoint slice, `'to'` keeps midpoint..end.
 */
function sliceHalfPolyline(
  points: Array<{ x: number; y: number }>,
  side: 'from' | 'to'
): Array<{ x: number; y: number }> {
  if (points.length < 2) return points;
  const segLens: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const len = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
    segLens.push(len);
    total += len;
  }
  if (total === 0) return points;
  const target = total / 2;
  let acc = 0;
  for (let i = 0; i < segLens.length; i++) {
    if (acc + segLens[i] >= target) {
      const t = (target - acc) / segLens[i];
      const mid = {
        x: points[i].x + (points[i + 1].x - points[i].x) * t,
        y: points[i].y + (points[i + 1].y - points[i].y) * t,
      };
      return side === 'from'
        ? [...points.slice(0, i + 1), mid]
        : [mid, ...points.slice(i + 1)];
    }
    acc += segLens[i];
  }
  return points;
}

interface LinkRendererProps {
  link: Link;
  fromNode: DiagramNode;
  toNode: DiagramNode;
  fromSolideMapping: SolideMapping;
  toSolideMapping: SolideMapping;
  selected: boolean;
  onSelect: () => void;
  onDblClick: () => void;
  onLabelDragEnd: (ox: number, oy: number) => void;
  /**
   * Render only one half of the polyline. 'from' = from-anchor → midpoint of
   * the path, 'to' = midpoint → to-anchor. Used to overlay the front half of
   * a mixed-front/behind link in Pass 4 (so the front end shows over the
   * node), while the full line lives in Pass 2 to be masked at the behind end.
   */
  halfMode?: 'from' | 'to';
  /**
   * If false, suppress the label and midpoint handles. Set on the half-line
   * overlay instance to avoid drawing labels/handles twice.
   */
  interactive?: boolean;
}

export function LinkRenderer({
  link,
  fromNode,
  toNode,
  fromSolideMapping,
  toSolideMapping,
  selected,
  onSelect,
  onDblClick,
  onLabelDragEnd,
  halfMode,
  interactive = true,
}: LinkRendererProps) {
  const solides = useDiagramStore((s) => s.solides);
  const updateLinkMidpoints = useDiagramStore((s) => s.updateLinkMidpoints);
  const selectedMidpoint = useDiagramStore((s) => s.selectedMidpoint);
  const selectMidpoint = useDiagramStore((s) => s.selectMidpoint);
  const solide = solides.get(link.solideId);
  const solideColor = solide?.color || '#4b5563';

  const strokeColor = solideColor;
  const strokeWidth = 1.5;

  const lineRef = React.useRef<Konva.Line>(null);
  const creatingRef = React.useRef<{ segIdx: number } | null>(null);

  // Resolve anchor points (pinned if explicit index, otherwise auto-select).
  // For polylines with midpoints, the relevant target for the from-side is
  // the first midpoint (segment leaving the from-node), and symmetrically
  // for the to-side. Without midpoints the target is the other node's center.
  // Midpoints are stored in grid units; convert once into pixels here so the
  // line / handles / projection all share the same coordinate space.
  const midpointsPx = (link.midpoints || []).map((mp) => ({ x: mp.x * CELL, y: mp.y * CELL }));

  const fromTargetInit = midpointsPx[0] ?? { x: toNode.x * CELL, y: toNode.y * CELL };
  const toTargetInit = midpointsPx[midpointsPx.length - 1] ?? { x: fromNode.x * CELL, y: fromNode.y * CELL };

  const fromAnchor = getBestAnchor(fromNode, fromTargetInit, link.solideId, fromSolideMapping, link.fromAnchorIdx, link.fromAnchorOffset);
  const toAnchor = getBestAnchor(toNode, toTargetInit, link.solideId, toSolideMapping, link.toAnchorIdx, link.toAnchorOffset);
  // Second pass: refine using resolved positions on each side. With shape
  // anchors (e.g. circles) this lets the projection settle on the actual
  // tangent point between the two endpoints. Skipped when an offset pins
  // the anchor: the position is fully determined by the stored offset.
  const fromTargetFinal = midpointsPx[0] ?? toAnchor;
  const toTargetFinal = midpointsPx[midpointsPx.length - 1] ?? fromAnchor;
  const fromFinal = getBestAnchor(fromNode, fromTargetFinal, link.solideId, fromSolideMapping, link.fromAnchorIdx, link.fromAnchorOffset);
  const toFinal = getBestAnchor(toNode, toTargetFinal, link.solideId, toSolideMapping, link.toAnchorIdx, link.toAnchorOffset);

  // Keep latest anchor refs for use in imperative handlers
  const fromRef = React.useRef(fromFinal);
  const toRef = React.useRef(toFinal);
  fromRef.current = fromFinal;
  toRef.current = toFinal;

  // For ortho/ortho-persp routing, compute auto-routed corners via A*.
  const nodes = useDiagramStore((s) => s.nodes);
  const routingMode = link.routingMode ?? 'direct';
  const autoCorners = React.useMemo(() => {
    if (routingMode === 'direct') return null;
    const excludeIds = new Set([link.fromNodeId, link.toNodeId]);
    return computeOrthoRoute(fromFinal, toFinal, routingMode, nodes, excludeIds);
  }, [routingMode, fromFinal.x, fromFinal.y, toFinal.x, toFinal.y, nodes, link.fromNodeId, link.toNodeId]);

  // Build full point sequence: from → midpoints → to (all in pixels for Konva)
  const activeMidpoints = autoCorners ?? midpointsPx;
  const allPoints: Array<{ x: number; y: number }> = [
    fromFinal,
    ...activeMidpoints,
    toFinal,
  ];

  // For mixed-classification links, render only one half of the polyline so
  // the half whose end is in front draws ON TOP of the masking node in Pass
  // 4, while the full line in Pass 2 still gets masked correctly at the
  // behind end. Split at the geometric midpoint along the polyline length.
  const renderedPoints = halfMode ? sliceHalfPolyline(allPoints, halfMode) : allPoints;
  const flatPoints = renderedPoints.flatMap((p) => [p.x, p.y]);

  // Midpoint of the full path (use geometric center of all points for label)
  const midX = (fromFinal.x + toFinal.x) / 2;
  const midY = (fromFinal.y + toFinal.y) / 2;

  // Compute segment midpoints for drag handles (only shown when selected
  // AND in direct routing mode — auto-routed links don't have manual midpoints)
  const isAutoRouted = routingMode !== 'direct';
  const segmentMids: Array<{ x: number; y: number; segIdx: number }> = [];
  if (selected && !isAutoRouted) {
    for (let i = 0; i < allPoints.length - 1; i++) {
      segmentMids.push({
        x: (allPoints[i].x + allPoints[i + 1].x) / 2,
        y: (allPoints[i].y + allPoints[i + 1].y) / 2,
        segIdx: i,
      });
    }
  }

  // Helper: get fresh midpoints from the store, converted to pixels so they
  // line up with the Konva Line points coordinate space (which is also where
  // the dragged handle sits while the user is moving it).
  const getFreshMidpointsPx = () => {
    const stored = useDiagramStore.getState().links.get(link.id)?.midpoints || [];
    return stored.map((p) => ({ x: p.x * CELL, y: p.y * CELL }));
  };

  // Helper: update Line node points directly (no React re-render)
  const updateLinePoints = (pts: Array<{ x: number; y: number }>) => {
    if (!lineRef.current) return;
    lineRef.current.points(pts.flatMap((p) => [p.x, p.y]));
    lineRef.current.getLayer()?.batchDraw();
  };

  // --- Segment handle: drag to create a new bend ---
  const handleSegmentDragStart = (segIdx: number, e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    creatingRef.current = { segIdx };
  };

  const handleSegmentDragMove = (_segIdx: number, e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    if (!creatingRef.current) return;
    const newX = snapPx(e.target.x());
    const newY = snapPx(e.target.y());
    const phantom = { x: newX, y: newY };
    const curPx = getFreshMidpointsPx();
    const pts = [
      fromRef.current,
      ...curPx.slice(0, creatingRef.current.segIdx),
      phantom,
      ...curPx.slice(creatingRef.current.segIdx),
      toRef.current,
    ];
    updateLinePoints(pts);
  };

  const handleSegmentDragEnd = (_segIdx: number, e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    if (!creatingRef.current) return;
    const segIdx = creatingRef.current.segIdx;
    const newX = snapPx(e.target.x());
    const newY = snapPx(e.target.y());
    const stored = useDiagramStore.getState().links.get(link.id)?.midpoints || [];
    const newMidpoints = [...stored];
    newMidpoints.splice(segIdx, 0, { x: newX / CELL, y: newY / CELL });
    updateLinkMidpoints(link.id, newMidpoints);
    creatingRef.current = null;
  };

  // --- Existing midpoint handle: drag to move ---
  const handleExistingMidpointDragMove = (midIdx: number, e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const newX = snapPx(e.target.x());
    const newY = snapPx(e.target.y());
    const curPx = getFreshMidpointsPx();
    curPx[midIdx] = { x: newX, y: newY };
    updateLinePoints([fromRef.current, ...curPx, toRef.current]);
  };

  const handleExistingMidpointDragEnd = (midIdx: number, e: Konva.KonvaEventObject<DragEvent>) => {
    e.cancelBubble = true;
    const newX = snapPx(e.target.x());
    const newY = snapPx(e.target.y());
    const stored = useDiagramStore.getState().links.get(link.id)?.midpoints || [];
    const newMidpoints = [...stored];
    newMidpoints[midIdx] = { x: newX / CELL, y: newY / CELL };
    updateLinkMidpoints(link.id, newMidpoints);
  };

  const handleMidpointDblClick = (midIdx: number) => {
    const stored = useDiagramStore.getState().links.get(link.id)?.midpoints || [];
    const newMidpoints = [...stored];
    newMidpoints.splice(midIdx, 1);
    updateLinkMidpoints(link.id, newMidpoints);
  };

  // Line dash pattern from lineStyle
  const dashPattern = (() => {
    switch (link.lineStyle) {
      case 'dashed': return [10, 5];
      case 'dotted': return [2, 4];
      default: return undefined;
    }
  })();

  // Arrow rendering helper
  const renderArrow = (type: string | undefined, tip: { x: number; y: number }, prev: { x: number; y: number }) => {
    if (!type || type === 'none') return null;
    const dx = tip.x - prev.x;
    const dy = tip.y - prev.y;
    const len = Math.hypot(dx, dy);
    if (len < 1) return null;
    const ux = dx / len, uy = dy / len;
    const px = -uy, py = ux;
    const sz = 7;
    if (type === 'triangle') {
      return (
        <Line
          points={[
            tip.x - ux * sz + px * sz * 0.5, tip.y - uy * sz + py * sz * 0.5,
            tip.x, tip.y,
            tip.x - ux * sz - px * sz * 0.5, tip.y - uy * sz - py * sz * 0.5,
          ]}
          closed
          fill={strokeColor}
          stroke={strokeColor}
          strokeWidth={1}
          listening={false}
        />
      );
    }
    // chevron
    return (
      <Line
        points={[
          tip.x - ux * sz + px * sz * 0.5, tip.y - uy * sz + py * sz * 0.5,
          tip.x, tip.y,
          tip.x - ux * sz - px * sz * 0.5, tip.y - uy * sz - py * sz * 0.5,
        ]}
        stroke={strokeColor}
        strokeWidth={1.5}
        listening={false}
      />
    );
  };

  return (
    <Group onClick={onSelect} onTap={onSelect} onDblClick={onDblClick}>
      {/* Main polyline — uses arcTo for rounded corners on ortho routes */}
      {isAutoRouted && renderedPoints.length > 2 ? (
        <Shape
          ref={lineRef as React.RefObject<Konva.Shape>}
          sceneFunc={(ctx, shape) => {
            const pts = renderedPoints;
            const r = 6;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length - 1; i++) {
              ctx.arcTo(pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y, r);
            }
            ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
            ctx.strokeShape(shape);
          }}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          hitStrokeWidth={12}
          dash={dashPattern}
        />
      ) : (
        <Line
          ref={lineRef}
          points={flatPoints}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          hitStrokeWidth={12}
          dash={dashPattern}
        />
      )}
      {/* Arrowheads */}
      {renderedPoints.length >= 2 && renderArrow(link.arrowStart, renderedPoints[0], renderedPoints[1])}
      {renderedPoints.length >= 2 && renderArrow(link.arrowEnd, renderedPoints[renderedPoints.length - 1], renderedPoints[renderedPoints.length - 2])}
      {interactive && link.label && (
        <Text
          x={midX + (link.labelOffsetX ?? 8)}
          y={midY + (link.labelOffsetY ?? -18)}
          text={link.label}
          fontSize={13}
          fontFamily="Inter, system-ui, sans-serif"
          fill={solideColor}
          draggable
          onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
            const newOx = e.target.x() - midX;
            const newOy = e.target.y() - midY;
            onLabelDragEnd(newOx, newOy);
          }}
        />
      )}
      {/* Existing midpoint handles — click to select, drag to move, double-click to delete
          (only in direct routing mode — auto-routed links compute corners automatically) */}
      {interactive && selected && !isAutoRouted && midpointsPx.map((mp, i) => {
        const isMpSelected = selectedMidpoint?.linkId === link.id && selectedMidpoint?.index === i;
        return (
          <Circle
            key={`mp-${i}`}
            x={mp.x}
            y={mp.y}
            radius={isMpSelected ? 5 : 4}
            fill={isMpSelected ? 'rgba(37, 99, 235, 0.6)' : 'rgba(37, 99, 235, 0.4)'}
            stroke={isMpSelected ? '#1d4ed8' : '#2563eb'}
            strokeWidth={isMpSelected ? 2 : 1.2}
            draggable
            onClick={(e) => { e.cancelBubble = true; selectMidpoint(link.id, i); }}
            onTap={(e) => { e.cancelBubble = true; selectMidpoint(link.id, i); }}
            onDragMove={(e) => handleExistingMidpointDragMove(i, e)}
            onDragEnd={(e) => handleExistingMidpointDragEnd(i, e)}
            onDblClick={(e) => { e.cancelBubble = true; handleMidpointDblClick(i); }}
          />
        );
      })}
      {/* Segment midpoint handles — drag to create a new bend */}
      {interactive && selected && segmentMids.map((sm) => (
        <Circle
          key={`seg-${sm.segIdx}`}
          x={sm.x}
          y={sm.y}
          radius={3}
          fill="rgba(120, 120, 120, 0.15)"
          stroke="rgba(100, 100, 100, 0.4)"
          strokeWidth={1}
          draggable
          onDragStart={(e) => handleSegmentDragStart(sm.segIdx, e)}
          onDragMove={(e) => handleSegmentDragMove(sm.segIdx, e)}
          onDragEnd={(e) => handleSegmentDragEnd(sm.segIdx, e)}
        />
      ))}
    </Group>
  );
}
