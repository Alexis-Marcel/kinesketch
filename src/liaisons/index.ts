import type { LiaisonDefinition, LiaisonType } from '../types';

export const LIAISON_DEFS: Record<LiaisonType, LiaisonDefinition> = {
  pivot: {
    type: 'pivot',
    name: 'Pivot',
    dof: 1,
    description: '1 rotation (Rz)',
  },
  glissiere: {
    type: 'glissiere',
    name: 'Glissière',
    dof: 1,
    description: '1 translation (Tz)',
  },
  pivot_glissant: {
    type: 'pivot_glissant',
    name: 'Pivot glissant',
    dof: 2,
    description: '1 rotation + 1 translation',
  },
  rotule: {
    type: 'rotule',
    name: 'Rotule',
    dof: 3,
    description: '3 rotations (Rx, Ry, Rz)',
  },
  encastrement: {
    type: 'encastrement',
    name: 'Encastrement',
    dof: 0,
    description: '0 degrés de liberté',
  },
  helicoidale: {
    type: 'helicoidale',
    name: 'Hélicoïdale',
    dof: 1,
    description: '1 rotation + 1 translation liées',
  },
  rotule_doigt: {
    type: 'rotule_doigt',
    name: 'Rotule à doigt',
    dof: 2,
    description: '2 rotations (Rx, Ry)',
  },
  appui_plan: {
    type: 'appui_plan',
    name: 'Appui plan',
    dof: 3,
    description: '2 translations + 1 rotation',
  },
  lineaire_annulaire: {
    type: 'lineaire_annulaire',
    name: 'Linéaire annulaire',
    dof: 4,
    description: '3 rotations + 1 translation',
  },
  lineaire_rectiligne: {
    type: 'lineaire_rectiligne',
    name: 'Linéaire rectiligne',
    dof: 4,
    description: '2 rotations + 2 translations',
  },
  ponctuelle: {
    type: 'ponctuelle',
    name: 'Ponctuelle',
    dof: 5,
    description: '3 rotations + 2 translations',
  },
};

export const LIAISON_LIST = Object.values(LIAISON_DEFS);
