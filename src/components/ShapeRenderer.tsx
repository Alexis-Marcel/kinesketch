import { Text } from 'react-konva';
import type Konva from 'konva';
import type { ComponentType } from 'react';
import type { DiagramNode, LiaisonType } from '../types';
import { CELL } from '../utils/snap';
import type { LiaisonComponentProps } from '../liaisons/LiaisonNode';
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

const LIAISON_COMPONENTS: Record<LiaisonType, ComponentType<LiaisonComponentProps>> = {
  pivot: Pivot,
  glissiere: Glissiere,
  pivot_glissant: PivotGlissant,
  rotule: Rotule,
  encastrement: Encastrement,
  helicoidale: Helicoidale,
  rotule_doigt: RotuleDoigt,
  appui_plan: AppuiPlan,
  lineaire_annulaire: LineaireAnnulaire,
  lineaire_rectiligne: LineaireRectiligne,
  ponctuelle: Ponctuelle,
  bati: Bati,
  engrenage_ext: EngrenageExt,
  engrenage_int: EngrenageInt,
  engrenage_conique: EngrenageConique,
  roue_vis_sans_fin: RoueVisSansFin,
  transmission_poulie_courroie: TransmissionPoulieCourroie,
  transmission_pignons_chaine: TransmissionPignonsChaine,
};

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
  const Component = LIAISON_COMPONENTS[node.type];
  const liaisonProps: LiaisonComponentProps = {
    x: node.x * CELL,
    y: node.y * CELL,
    rotation: node.rotation,
    scale: node.scale ?? 1,
    view: node.view ?? 1,
    colorA: colors[0],
    colorB: colors[1],
    onSelect,
    onDblClick,
    onDragMove: (px, py) => onDragMove(px / CELL, py / CELL),
    onDragEnd: (px, py) => onDragEnd(px / CELL, py / CELL),
  };

  return (
    <>
      <Component {...liaisonProps} />
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
