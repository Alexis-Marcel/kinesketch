import { Text } from 'react-konva';
import type Konva from 'konva';
import type { DiagramNode } from '../types';
import { CELL } from '../utils/snap';
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
import { Bati } from '../liaisons/Bati';
import { EngrenageExt } from '../liaisons/EngrenageExt';
import { EngrenageInt } from '../liaisons/EngrenageInt';
import { EngrenageConique } from '../liaisons/EngrenageConique';
import { RoueVisSansFin } from '../liaisons/RoueVisSansFin';
import { TransmissionPoulieCourroie } from '../liaisons/TransmissionPoulieCourroie';
import { TransmissionPignonsChaine } from '../liaisons/TransmissionPignonsChaine';

interface ShapeRendererProps {
  node: DiagramNode;
  selected: boolean;
  colors: [string, string];
  onSelect: () => void;
  onDblClick: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onLabelDragEnd: (ox: number, oy: number) => void;
}

export function ShapeRenderer({ node, selected, colors, onSelect, onDblClick, onDragMove, onDragEnd, onLabelDragEnd }: ShapeRendererProps) {
  // Convert grid units → pixels for Konva, and callbacks pixels → grid
  const commonProps = {
    x: node.x * CELL,
    y: node.y * CELL,
    rotation: node.rotation,
    scale: node.scale ?? 1,
    view: node.view ?? 1 as const,
    selected,
    colorA: colors[0],
    colorB: colors[1],
    onSelect,
    onDblClick,
    onDragMove: (px: number, py: number) => onDragMove(px / CELL, py / CELL),
    onDragEnd: (px: number, py: number) => onDragEnd(px / CELL, py / CELL),
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
    case 'bati':
      shapeElement = <Bati {...commonProps} />;
      break;
    case 'engrenage_ext':
      shapeElement = <EngrenageExt {...commonProps} />;
      break;
    case 'engrenage_int':
      shapeElement = <EngrenageInt {...commonProps} />;
      break;
    case 'engrenage_conique':
      shapeElement = <EngrenageConique {...commonProps} />;
      break;
    case 'roue_vis_sans_fin':
      shapeElement = <RoueVisSansFin {...commonProps} />;
      break;
    case 'transmission_poulie_courroie':
      shapeElement = <TransmissionPoulieCourroie {...commonProps} />;
      break;
    case 'transmission_pignons_chaine':
      shapeElement = <TransmissionPignonsChaine {...commonProps} />;
      break;
  }

  return (
    <>
      {shapeElement}
      {node.label && (
        <Text
          x={node.x * CELL + (node.labelOffsetX ?? 20)}
          y={node.y * CELL + (node.labelOffsetY ?? -20)}
          text={node.label}
          fontSize={13}
          fontFamily="Inter, system-ui, sans-serif"
          fill={selected ? '#2563eb' : '#374151'}
          draggable
          onDragEnd={(e: Konva.KonvaEventObject<DragEvent>) => {
            const newOx = e.target.x() - node.x * CELL;
            const newOy = e.target.y() - node.y * CELL;
            onLabelDragEnd(newOx, newOy);
          }}
        />
      )}
    </>
  );
}
