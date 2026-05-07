import { createContext, useContext, type ReactNode } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';

/**
 * Shared DnD wrapper for every NavTree row + Orphan row.
 *
 * The whole row (no separate handle) is the drag source: a pointer-down
 * with movement past the activation distance starts a drag, while a click
 * without movement still triggers the row's normal `onClick` (file select,
 * group expand). The drop-line indicator is rendered by reading the
 * shared `HoverState` — when the over row id matches and the side flag
 * matches, a 2px line appears at the top or bottom of the row, showing
 * exactly where the drop will land.
 */

export type DropSide = 'above' | 'below';

export interface HoverState {
  overId: string | null;
  side: DropSide | null;
}

const HoverCtx = createContext<HoverState>({ overId: null, side: null });

export function HoverProvider({
  hover,
  children,
}: {
  hover: HoverState;
  children: ReactNode;
}) {
  return <HoverCtx.Provider value={hover}>{children}</HoverCtx.Provider>;
}

export function useHover() {
  return useContext(HoverCtx);
}

interface DragRowProps {
  /** Stable id used by DndContext + SortableContext. NavTree rows pass their
   *  settings key (`tab:`, `group:`, `page:` prefixed); orphans pass
   *  `orphan:<filePath>`. */
  id: string;
  /** When true, the row participates in DnD but cannot be dropped on (e.g.
   *  tab rows — top-level reorder isn't in scope). It can still be the
   *  source if `draggable` is true. */
  droppable?: boolean;
  /** When false, the row can be a drop target but not dragged. Defaults to
   *  true. */
  draggable?: boolean;
  children: ReactNode;
}

export function DragRow({
  id,
  droppable = true,
  draggable = true,
  children,
}: DragRowProps) {
  const sortable = useSortable({ id, disabled: !draggable && !droppable });
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } = sortable;
  const hover = useHover();
  const showLine = droppable && hover.overId === id;

  return (
    <div
      ref={setNodeRef}
      data-dnd-id={id}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
        position: 'relative',
      }}
      {...(draggable ? attributes : {})}
      {...(draggable ? listeners : {})}
    >
      {showLine && hover.side === 'above' ? <DropLine position='top' /> : null}
      {children}
      {showLine && hover.side === 'below' ? <DropLine position='bottom' /> : null}
    </div>
  );
}

function DropLine({ position }: { position: 'top' | 'bottom' }) {
  return (
    <div
      aria-hidden='true'
      className={cn(
        'pointer-events-none absolute inset-x-1 h-0.5 rounded-full bg-emerald-500',
        position === 'top' ? '-top-px' : '-bottom-px',
      )}
    />
  );
}
