import type { ReactNode } from 'react';
import { Group } from 'react-konva';
import type Konva from 'konva';
import type { LiaisonType, LiaisonView } from '../types';
import { snapPx } from '../utils/snap';
import { HitRect } from './HitRect';

/**
 * Shared props for every 2D liaison renderer. The shape-specific JSX lives in
 * the children of <LiaisonNode>; transform/drag/snap/hit boilerplate is
 * centralized here so each liaison file can focus on its visual identity.
 */
export interface LiaisonComponentProps {
  x: number;
  y: number;
  rotation: number;
  scale?: number;
  view?: LiaisonView;
  colorA?: string;
  colorB?: string;
  onSelect: () => void;
  onDragMove: (x: number, y: number) => void;
  onDragEnd: (x: number, y: number) => void;
  onDblClick: () => void;
}

interface LiaisonNodeProps extends LiaisonComponentProps {
  type: LiaisonType;
  children: ReactNode;
}

/**
 * Wraps a liaison's visual content in the standard Group + HitRect, with the
 * standard pixel-snapping drag handlers. Every 2D liaison goes through this.
 */
export function LiaisonNode({
  type,
  x,
  y,
  rotation,
  scale = 1,
  view = 1,
  onSelect,
  onDragMove,
  onDragEnd,
  onDblClick,
  children,
}: LiaisonNodeProps) {
  const handleDrag = (
    e: Konva.KonvaEventObject<DragEvent>,
    cb: (x: number, y: number) => void
  ) => {
    const sx = snapPx(e.target.x());
    const sy = snapPx(e.target.y());
    e.target.x(sx);
    e.target.y(sy);
    cb(sx, sy);
  };

  return (
    <Group
      x={x}
      y={y}
      rotation={rotation}
      scaleX={scale}
      scaleY={scale}
      draggable
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onDblClick}
      onDragMove={(e) => handleDrag(e, onDragMove)}
      onDragEnd={(e) => handleDrag(e, onDragEnd)}
    >
      <HitRect type={type} view={view} />
      {children}
    </Group>
  );
}
