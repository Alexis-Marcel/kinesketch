import type { LiaisonView } from '../types';

/** Shared props for all 3D liaison components. */
export interface Liaison3DProps {
  colorA: string;
  colorB: string;
  view: LiaisonView;
}
