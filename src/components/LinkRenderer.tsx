import { Group, Line, Text } from 'react-konva';
import type Konva from 'konva';
import { useDiagramStore } from '../store/diagramStore';
import type { DiagramNode, Link } from '../types';
import { getBestAnchor, type SolideMapping } from '../utils/anchors';

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
}

export function LinkRenderer({ link, fromNode, toNode, fromSolideMapping, toSolideMapping, selected, onSelect, onDblClick, onLabelDragEnd }: LinkRendererProps) {
  const solides = useDiagramStore((s) => s.solides);
  const solide = solides.get(link.solideId);
  const solideColor = solide?.color || '#4b5563';

  const strokeColor = selected ? '#2563eb' : solideColor;
  const strokeWidth = selected ? 3 : 2;

  // Resolve anchor points (pinned if explicit index, otherwise auto-select)
  const fromAnchor = getBestAnchor(fromNode, { x: toNode.x, y: toNode.y }, link.solideId, fromSolideMapping, link.fromAnchorIdx);
  const toAnchor = getBestAnchor(toNode, { x: fromNode.x, y: fromNode.y }, link.solideId, toSolideMapping, link.toAnchorIdx);
  // Second pass: refine auto-selected anchors using resolved positions
  const fromFinal = getBestAnchor(fromNode, toAnchor, link.solideId, fromSolideMapping, link.fromAnchorIdx);
  const toFinal = getBestAnchor(toNode, fromAnchor, link.solideId, toSolideMapping, link.toAnchorIdx);

  const midX = (fromFinal.x + toFinal.x) / 2;
  const midY = (fromFinal.y + toFinal.y) / 2;

  return (
    <Group onClick={onSelect} onTap={onSelect} onDblClick={onDblClick}>
      <Line
        points={[fromFinal.x, fromFinal.y, toFinal.x, toFinal.y]}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        hitStrokeWidth={12}
      />
      {link.label && (
        <Text
          x={midX + (link.labelOffsetX ?? 8)}
          y={midY + (link.labelOffsetY ?? -18)}
          text={link.label}
          fontSize={13}
          fontFamily="Inter, system-ui, sans-serif"
          fill={selected ? '#2563eb' : solideColor}
          draggable
          onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
            const newOx = e.target.x() - midX;
            const newOy = e.target.y() - midY;
            onLabelDragEnd(newOx, newOy);
          }}
        />
      )}
    </Group>
  );
}
