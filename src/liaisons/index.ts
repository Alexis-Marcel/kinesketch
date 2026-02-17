import type { LiaisonDefinition, LiaisonType } from '../types';

export const LIAISON_DEFS: Record<LiaisonType, LiaisonDefinition> = {
  pivot: {
    type: 'pivot',
    name: 'Pivot',
    dof: 1,
    description: '1 rotation (Rz)',
    viewCount: 2,
  },
  glissiere: {
    type: 'glissiere',
    name: 'Glissière',
    dof: 1,
    description: '1 translation (Tz)',
    viewCount: 2,
  },
  pivot_glissant: {
    type: 'pivot_glissant',
    name: 'Pivot glissant',
    dof: 2,
    description: '1 rotation + 1 translation',
    viewCount: 2,
  },
  rotule: {
    type: 'rotule',
    name: 'Rotule',
    dof: 3,
    description: '3 rotations (Rx, Ry, Rz)',
    viewCount: 1,
  },
  encastrement: {
    type: 'encastrement',
    name: 'Encastrement',
    dof: 0,
    description: '0 degrés de liberté',
    viewCount: 1,
  },
  helicoidale: {
    type: 'helicoidale',
    name: 'Hélicoïdale',
    dof: 1,
    description: '1 rotation + 1 translation liées',
    viewCount: 2,
  },
  rotule_doigt: {
    type: 'rotule_doigt',
    name: 'Rotule à doigt',
    dof: 2,
    description: '2 rotations (Rx, Ry)',
    viewCount: 1,
  },
  appui_plan: {
    type: 'appui_plan',
    name: 'Appui plan',
    dof: 3,
    description: '2 translations + 1 rotation',
    viewCount: 1,
  },
  lineaire_annulaire: {
    type: 'lineaire_annulaire',
    name: 'Linéaire annulaire',
    dof: 4,
    description: '3 rotations + 1 translation',
    viewCount: 2,
  },
  lineaire_rectiligne: {
    type: 'lineaire_rectiligne',
    name: 'Linéaire rectiligne',
    dof: 4,
    description: '2 rotations + 2 translations',
    viewCount: 2,
  },
  ponctuelle: {
    type: 'ponctuelle',
    name: 'Ponctuelle',
    dof: 5,
    description: '3 rotations + 2 translations',
    viewCount: 1,
  },
};

export const LIAISON_LIST = Object.values(LIAISON_DEFS);
