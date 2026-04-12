import type { LiaisonType, LiaisonView } from '../types';

export interface LiaisonBounds {
  halfW: number;
  halfH: number;
}

/**
 * Shared "big gear" circle radius used in the view-2 schematic of all
 * gear-style liaisons (engrenage extérieur, intérieur, conique, and the worm
 * gear). Keeping it in one place ensures the wheel size stays consistent
 * across mechanisms.
 */
export const BIG_GEAR_R = 58;

// Default bounds applied when a (type, view) entry is not in REGISTRY.
const DEFAULT: Record<LiaisonView, LiaisonBounds> = {
  1: { halfW: 40, halfH: 16 },
  2: { halfW: 16, halfH: 16 },
  3: { halfW: 40, halfH: 40 },
};

// Single source of truth for both the click `<Rect>` inside each liaison
// renderer AND the dashed selection rectangle drawn in Canvas.tsx.
const REGISTRY: Partial<Record<LiaisonType, Partial<Record<LiaisonView, LiaisonBounds>>>> = {
  pivot: {
    1: { halfW: 44, halfH: 16 },
    3: { halfW: 16, halfH: 44 },
  },
  pivot_glissant: {
    1: { halfW: 44, halfH: 16 },
    3: { halfW: 16, halfH: 44 },
  },
  glissiere: {
    1: { halfW: 44, halfH: 16 },
    3: { halfW: 22, halfH: 42 },
  },
  rotule: { 1: { halfW: 26, halfH: 26 } },
  rotule_doigt: { 1: { halfW: 26, halfH: 26 } },
  encastrement: { 1: { halfW: 36, halfH: 26 } },
  bati: { 1: { halfW: 26, halfH: 26 } },
  engrenage_ext: {
    1: { halfW: 12, halfH: 84 },
    2: { halfW: 94, halfH: 94 },
  },
  engrenage_int: {
    1: { halfW: 26, halfH: 84 },
    2: { halfW: 60, halfH: 60 },
  },
  engrenage_conique: {
    1: { halfW: 48, halfH: 48 },
    2: { halfW: 68, halfH: 60 },
  },
  roue_vis_sans_fin: {
    1: { halfW: 24, halfH: 86 },
    2: { halfW: 60, halfH: 78 },
  },
  transmission_poulie_courroie: {
    1: { halfW: 130, halfH: 14 },
    2: { halfW: 130, halfH: 64 },
  },
  transmission_pignons_chaine: {
    1: { halfW: 130, halfH: 12 },
    2: { halfW: 130, halfH: 64 },
  },
};

export function getLiaisonBounds(type: LiaisonType, view: LiaisonView): LiaisonBounds {
  return REGISTRY[type]?.[view] ?? DEFAULT[view] ?? DEFAULT[1];
}
