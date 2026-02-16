import { Group, Line, Text } from 'react-konva';
import type Konva from 'konva';
import { useDiagramStore } from '../store/diagramStore';
import type { DiagramNode, Link } from '../types';

interface LinkRendererProps {
  link: Link;
  fromNode: DiagramNode;
  toNode: DiagramNode;
  selected: boolean;
  onSelect: () => void;
  onDblClick: () => void;
  onLabelDragEnd: (ox: number, oy: number) => void;
}

export function LinkRenderer({ link, fromNode, toNode, selected, onSelect, onDblClick, onLabelDragEnd }: LinkRendererProps) {
  const solides = useDiagramStore((s) => s.solides);
  const solide = solides.get(link.solideId);
  const solideColor = solide?.color || '#4b5563';

  const strokeColor = selected ? '#2563eb' : solideColor;
  const strokeWidth = selected ? 3 : 2;

  const midX = (fromNode.x + toNode.x) / 2;
  const midY = (fromNode.y + toNode.y) / 2;

  return (
    <Group onClick={onSelect} onTap={onSelect} onDblClick={onDblClick}>
      <Line
        points={[fromNode.x, fromNode.y, toNode.x, toNode.y]}
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
