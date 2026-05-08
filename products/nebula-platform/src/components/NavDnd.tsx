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

export type DropSide = 'above' | 'below' | 'into';

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
  const isHovered = droppable && hover.overId === id;
  const showInto = isHovered && hover.side === 'into';

  // Tabs and groups are containers — they should never shift during a drag.
  // dnd-kit's `useSortable` applies transforms to non-source siblings to
  // animate them aside as the cursor passes; that's the right behavior for
  // page rows reordering inside a list, but tabs/groups receive 'into'
  // drops where shifting only makes the drop target hard to land on. Lock
  // their transforms to identity so they stay where they are no matter what
  // the cursor is doing above them. Their `isDragging` (the source-of-drag
  // dim) still applies via opacity below.
  const isContainer = id.startsWith('tab:') || id.startsWith('group:');
  const transformValue = isContainer ? undefined : CSS.Transform.toString(transform);
  const transitionValue = isContainer ? 'none' : transition;

  return (
    <div
      ref={setNodeRef}
      data-dnd-id={id}
      style={{
        transform: transformValue,
        transition: transitionValue,
        opacity: isDragging ? 0.4 : 1,
        position: 'relative',
      }}
      {...(draggable ? attributes : {})}
      {...(draggable ? listeners : {})}
    >
      {isHovered && hover.side === 'above' ? <DropLine position='top' /> : null}
      {children}
      {isHovered && hover.side === 'below' ? <DropLine position='bottom' /> : null}
      {/* Whole-row "drop INTO this container" highlight. Sits as an absolute
          overlay so it doesn't disturb layout or push siblings around — the
          row itself stays put while the indicator shows that releasing the
          pointer here will nest the dragged page inside this tab/group. */}
      {showInto ? <DropZone /> : null}
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

function DropZone() {
  // Mintlify-style "drop into" indicator: low-opacity neutral pill plus a
  // crisp solid 1px outline tracing the row. White-on-dark in dark mode,
  // black-on-light in light mode. The pill fill is faint so the row's own
  // text stays readable through the overlay; the solid border carries the
  // "release here" signal.
  return (
    <div
      aria-hidden='true'
      className='pointer-events-none absolute inset-0 rounded-xl border border-foreground bg-foreground/[0.06] dark:border-white dark:bg-white/10'
    />
  );
}
