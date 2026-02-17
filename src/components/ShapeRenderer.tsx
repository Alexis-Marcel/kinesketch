import { Group, Line, Text } from 'react-konva';
import type Konva from 'konva';
import type { DiagramNode } from '../types';
import { Pivot } from '../liaisons/Pivot';
import { Glissiere } from '../liaisons/Glissiere';
import { PivotGlissant } from '../liaisons/PivotGlissant';
import { Rotule } from '../liaisons/Rotule';
import { Encastrement } from '../liaisons/Encastrement';
import { Helicoidale } from '../liaisons/Helicoidale';
import { RotuleDoigt } from '../liaisons/RotuleDoigt';
import { AppuiPlan } from '../liaisons/AppuiPlan';
import { LineaireAnnulaire } from '../liaisons/LineaireAnnulaire';
import { LineaireRectiligne } from '../liaisons/LineaireRectiligne';
import { Ponctuelle } from '../liaisons/Ponctuelle';

interface ShapeRendererProps {
  node: DiagramNode;
  selected: boolean;
  isBati?: boolean;
  colors: [string, string];
  onSelect: () => void;
  onDblClick: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onLabelDragEnd: (ox: number, oy: number) => void;
}

export function ShapeRenderer({ node, selected, isBati, colors, onSelect, onDblClick, onDragMove, onDragEnd, onLabelDragEnd }: ShapeRendererProps) {
  const commonProps = {
    x: node.x,
    y: node.y,
    rotation: node.rotation,
    view: node.view ?? 1 as const,
    selected,
    colorA: colors[0],
    colorB: colors[1],
    onSelect,
    onDblClick,
    onDragMove,
    onDragEnd,
  };

  let shapeElement: React.ReactNode;

  switch (node.type) {
    case 'pivot':
      shapeElement = <Pivot {...commonProps} />;
      break;
    case 'glissiere':
      shapeElement = <Glissiere {...commonProps} />;
      break;
    case 'pivot_glissant':
      shapeElement = <PivotGlissant {...commonProps} />;
      break;
    case 'rotule':
      shapeElement = <Rotule {...commonProps} />;
      break;
    case 'encastrement':
      shapeElement = <Encastrement {...commonProps} />;
      break;
    case 'helicoidale':
      shapeElement = <Helicoidale {...commonProps} />;
      break;
    case 'rotule_doigt':
      shapeElement = <RotuleDoigt {...commonProps} />;
      break;
    case 'appui_plan':
      shapeElement = <AppuiPlan {...commonProps} />;
      break;
    case 'lineaire_annulaire':
      shapeElement = <LineaireAnnulaire {...commonProps} />;
      break;
    case 'lineaire_rectiligne':
      shapeElement = <LineaireRectiligne {...commonProps} />;
      break;
    case 'ponctuelle':
      shapeElement = <Ponctuelle {...commonProps} />;
      break;
  }

  // Bâti hatching: horizontal ground line + short diagonal strokes (ISO 3952)
  const batiHatching = isBati ? (
    <Group x={node.x} y={node.y} rotation={node.rotation}>
      <Line points={[-22, 24, 22, 24]} stroke="#374151" strokeWidth={2} listening={false} />
      {[-16, -10, -4, 2, 8, 14].map((offset) => (
        <Line
          key={offset}
          points={[offset, 24, offset - 7, 32]}
          stroke="#374151"
          strokeWidth={1.2}
          listening={false}
        />
      ))}
    </Group>
  ) : null;

  return (
    <>
      {batiHatching}
      {shapeElement}
      {node.label && (
        <Text
          x={node.x + (node.labelOffsetX ?? 20)}
          y={node.y + (node.labelOffsetY ?? -20)}
          text={node.label}
          fontSize={13}
          fontFamily="Inter, system-ui, sans-serif"
          fill={selected ? '#2563eb' : '#374151'}
          draggable
          onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
            const newOx = e.target.x() - node.x;
            const newOy = e.target.y() - node.y;
            onLabelDragEnd(newOx, newOy);
          }}
        />
      )}
    </>
  );
}
