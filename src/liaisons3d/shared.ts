import type { LiaisonView } from '../types';

/** Shared props for all 3D liaison components */
export interface Liaison3DProps {
  colorA: string;
  colorB: string;
  selected: boolean;
  hovered: boolean;
  view: LiaisonView;
}

/** Selection/hover emission intensity */
export function getEmissiveIntensity(selected: boolean, hovered: boolean): number {
  if (selected) return 0.3;
  if (hovered) return 0.15;
  return 0;
}
