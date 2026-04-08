import { Rect } from 'react-konva';
import type { LiaisonType, LiaisonView } from '../types';
import { getLiaisonBounds } from './bounds';

interface HitRectProps {
  type: LiaisonType;
  view: number;
}

/**
 * Transparent click/hit rectangle sized from the centralized bounds registry.
 * Use inside each liaison renderer's <Group> so the click area always matches
 * the dashed selection rectangle drawn by Canvas.
 */
export function HitRect({ type, view }: HitRectProps) {
  const { halfW, halfH } = getLiaisonBounds(type, view as LiaisonView);
  return (
    <Rect
      x={-halfW}
      y={-halfH}
      width={halfW * 2}
      height={halfH * 2}
      fill="transparent"
    />
  );
}
