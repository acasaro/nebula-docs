import type { Editor } from '@tiptap/core';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  EllipsisVertical,
  GripVertical,
  Plus,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import {
  useEffect,
  useLayoutEffect,
  useState,
  useSyncExternalStore,
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { cn } from '@/lib/utils';

/**
 * GFM-compatible table editing — Tiptap's table extensions plus a small
 * Mintlify-style chrome. The chrome is intentionally minimal:
 *
 *  • One `+` bumper on the right edge (add column at end)
 *  • One `+` bumper on the bottom (add row at end)
 *  • One column-handle dot — visible only above the column whose cell
 *    contains the cursor — opens a menu with insert / align / delete
 *  • A primary-color ring around the active cell (PM Decoration; not
 *    `:focus-within` since DOM focus lives on the editor root, not cells)
 *
 * Row handles, move/copy, and per-column always-visible dots are
 * intentionally absent — Mintlify's reference shows none of those, and
 * insert/delete are one click away via the column handle menu.
 *
 * Manual NodeView (not React) so `<table>` IS the contentDOM. The React
 * NodeView from Tiptap inserts a `<div data-node-view-content-react>`
 * inside the `<table>`, which is invalid HTML and breaks the layout.
 */

const COLUMN_ALIGN_VALUES = ['left', 'center', 'right'] as const;
type ColumnAlign = (typeof COLUMN_ALIGN_VALUES)[number];

function withAlignAttr<T extends typeof TableCell | typeof TableHeader>(node: T): T {
  return node.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        align: {
          default: null,
          parseHTML: (el: HTMLElement) => {
            const a = el.getAttribute('data-align');
            return COLUMN_ALIGN_VALUES.includes(a as ColumnAlign) ? a : null;
          },
          renderHTML: (attrs: Record<string, unknown>) => {
            const a = attrs.align;
            if (!a) return {};
            return { 'data-align': a, style: `text-align: ${a};` };
          },
        },
      };
    },
  }) as T;
}

/** Decorates the cell containing the cursor with `mdx-cell-active` so CSS
 *  can paint the primary-color ring. */
const activeCellPluginKey = new PluginKey('mdx-table-active-cell');

const activeCellPlugin = new Plugin({
  key: activeCellPluginKey,
  props: {
    decorations(state) {
      const $head = state.selection.$head;
      for (let d = $head.depth; d > 0; d--) {
        const n = $head.node(d);
        if (n.type.name === 'tableCell' || n.type.name === 'tableHeader') {
          const pos = $head.before(d);
          return DecorationSet.create(state.doc, [
            Decoration.node(pos, pos + n.nodeSize, { class: 'mdx-cell-active' }),
          ]);
        }
      }
      return DecorationSet.empty;
    },
  },
});

export const MdxTable = Table.extend({
  addProseMirrorPlugins() {
    return [...(this.parent?.() ?? []), activeCellPlugin];
  },
  addNodeView() {
    return ({ node, editor, getPos }) => {
      const dom = document.createElement('div');
      dom.setAttribute('data-mdx-table', '');
      dom.className = 'mdx-table-wrapper group/table relative my-4';

      const scrollWrap = document.createElement('div');
      scrollWrap.className = 'overflow-x-auto rounded-lg border border-border/50';
      dom.appendChild(scrollWrap);

      const table = document.createElement('table');
      table.className = 'mdx-table w-full border-collapse';
      scrollWrap.appendChild(table);

      const chromeMount = document.createElement('div');
      chromeMount.className = 'pointer-events-none absolute inset-0';
      dom.appendChild(chromeMount);

      let root: Root | null = null;
      const renderChrome = (currentNode = node) => {
        if (!root) root = createRoot(chromeMount);
        root.render(
          <TableChrome
            editor={editor as Editor}
            getPos={getPos as () => number | undefined}
            node={currentNode}
          />,
        );
      };
      renderChrome();

      return {
        dom,
        contentDOM: table,
        update(updatedNode) {
          if (updatedNode.type !== node.type) return false;
          renderChrome(updatedNode);
          return true;
        },
        destroy() {
          queueMicrotask(() => root?.unmount());
        },
        ignoreMutation(mutation) {
          return chromeMount.contains(mutation.target as Node);
        },
      };
    };
  },
}).configure({
  resizable: false,
  HTMLAttributes: { class: 'mdx-table' },
});

export const MdxTableRow = TableRow;
export const MdxTableHeader = withAlignAttr(TableHeader).configure({
  HTMLAttributes: { class: 'mdx-table-header-cell' },
});
export const MdxTableCell = withAlignAttr(TableCell).configure({
  HTMLAttributes: { class: 'mdx-table-cell' },
});

// ── React chrome ─────────────────────────────────────────────────────────

interface TableChromeProps {
  editor: Editor;
  getPos: () => number | undefined;
  node: import('@tiptap/pm/model').Node;
}

function TableChrome({ editor, getPos, node }: TableChromeProps) {
  // Subscribe to selection changes so the column handle re-renders when
  // the cursor moves to a different column. `useSyncExternalStore` is the
  // Tiptap-friendly way: editor events drive a snapshot tick, React picks
  // it up next render.
  const tick = useEditorTick(editor);
  const activeCol = activeColumnInThisTable(editor, getPos);
  // Tick is read so the snapshot is observed; suppressed because we don't
  // need its value directly.
  void tick;

  const colCount = node.firstChild?.childCount ?? 0;
  const rowCount = node.childCount;
  const alignments = readColumnAlignments(node);
  const activeRow = activeRowInThisTable(editor, getPos);

  // Bumpers: place the cursor inside a cell of THIS table BEFORE running
  // the command. Without this, `editor.chain().focus().addColumnAfter()`
  // operates on whatever the previous selection was — usually outside the
  // table — so the command silently no-ops. The "phantom newline" the user
  // saw was that no-op refocusing the editor at the doc end.
  const addColumnAtEnd = () => {
    focusLastCellInTable(editor, getPos);
    editor.chain().focus().addColumnAfter().run();
  };
  const addRowAtEnd = () => {
    focusLastCellInTable(editor, getPos);
    editor.chain().focus().addRowAfter().run();
  };

  return (
    <>
      <BumperButton
        ariaLabel="Add column"
        className="absolute -right-3 top-1/2 -translate-y-1/2"
        onClick={addColumnAtEnd}
      />
      <BumperButton
        ariaLabel="Add row"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
        onClick={addRowAtEnd}
      />
      {activeCol !== null && activeCol < colCount ? (
        <ColumnHandle
          editor={editor}
          getPos={getPos}
          index={activeCol}
          currentAlign={alignments[activeCol] ?? null}
        />
      ) : null}
      {activeRow !== null && activeRow < rowCount ? (
        <RowHandle editor={editor} getPos={getPos} index={activeRow} />
      ) : null}
    </>
  );
}

function BumperButton({
  ariaLabel,
  className,
  onClick,
}: {
  ariaLabel: string;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        'pointer-events-auto flex size-6 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground shadow-sm transition-all',
        'opacity-0 group-hover/table:opacity-100 hover:bg-accent hover:text-foreground',
        className,
      )}
    >
      <Plus className="size-3.5" />
    </button>
  );
}

interface ColumnHandleProps {
  editor: Editor;
  getPos: () => number | undefined;
  index: number;
  currentAlign: ColumnAlign | null;
}

function ColumnHandle({ editor, getPos, index, currentAlign }: ColumnHandleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rect = useColumnRect(editor, getPos, index);
  if (!rect) return null;

  const close = () => setMenuOpen(false);
  const run = (fn: () => unknown) => {
    fn();
    close();
  };

  return (
    <div
      className="absolute inset-x-0 -top-1 h-4"
      style={{ pointerEvents: 'none' }}
    >
      <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label={`Column ${index + 1} options`}
            // Don't intercept any events here — Radix's Popover.Trigger
            // composes its own click + pointerdown handlers on this same
            // button via `asChild`, and any stopPropagation we add ends up
            // racing with those. The handle sits *outside* the editable
            // region (above the table top edge) so clicks here don't move
            // the cursor anyway.
            className={cn(
              'pointer-events-auto absolute flex h-4 items-center justify-center rounded-t-md border border-b-0 transition-colors',
              'border-primary bg-primary text-primary-foreground shadow-sm',
              'hover:bg-primary/90',
            )}
            style={rect}
          >
            <GripVertical className="size-3 rotate-90" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            align="center"
            sideOffset={6}
            collisionPadding={12}
            className={cn(
              'z-50 min-w-[180px] rounded-md border bg-popover p-1 text-sm shadow-md',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            )}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <MenuItem
              icon={ChevronLeft}
              label="Insert before"
              onClick={() => run(() => editor.chain().focus().addColumnBefore().run())}
            />
            <MenuItem
              icon={ChevronRight}
              label="Insert after"
              onClick={() => run(() => editor.chain().focus().addColumnAfter().run())}
            />
            <MenuSeparator />
            <MenuItem
              icon={AlignLeft}
              label="Align left"
              checked={currentAlign === null || currentAlign === 'left'}
              onClick={() => run(() => setColumnAlign(editor, getPos, 'left'))}
            />
            <MenuItem
              icon={AlignCenter}
              label="Align center"
              checked={currentAlign === 'center'}
              onClick={() => run(() => setColumnAlign(editor, getPos, 'center'))}
            />
            <MenuItem
              icon={AlignRight}
              label="Align right"
              checked={currentAlign === 'right'}
              onClick={() => run(() => setColumnAlign(editor, getPos, 'right'))}
            />
            <MenuSeparator />
            <MenuItem
              icon={Trash2}
              label="Delete column"
              destructive
              onClick={() => run(() => editor.chain().focus().deleteColumn().run())}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

interface RowHandleProps {
  editor: Editor;
  getPos: () => number | undefined;
  index: number;
}

function RowHandle({ editor, getPos, index }: RowHandleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const rect = useRowRect(editor, getPos, index);
  if (!rect) return null;

  const close = () => setMenuOpen(false);
  const run = (fn: () => unknown) => {
    fn();
    close();
  };

  return (
    <div
      className="absolute inset-y-0 -left-1 w-4"
      style={{ pointerEvents: 'none' }}
    >
      <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            aria-label={`Row ${index + 1} options`}
            className={cn(
              'pointer-events-auto absolute flex w-4 items-center justify-center rounded-l-md border border-r-0 transition-colors',
              'border-primary bg-primary text-primary-foreground shadow-sm',
              'hover:bg-primary/90',
            )}
            style={rect}
          >
            <EllipsisVertical className="size-3" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="right"
            align="center"
            sideOffset={6}
            collisionPadding={12}
            className={cn(
              'z-50 min-w-[180px] rounded-md border bg-popover p-1 text-sm shadow-md',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
              'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
            )}
            onCloseAutoFocus={(e) => e.preventDefault()}
          >
            <MenuItem
              icon={ArrowUp}
              label="Insert above"
              onClick={() => run(() => editor.chain().focus().addRowBefore().run())}
            />
            <MenuItem
              icon={ArrowDown}
              label="Insert below"
              onClick={() => run(() => editor.chain().focus().addRowAfter().run())}
            />
            <MenuSeparator />
            <MenuItem
              icon={Trash2}
              label="Delete row"
              destructive
              onClick={() => run(() => editor.chain().focus().deleteRow().run())}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

interface MenuItemProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  checked?: boolean;
  destructive?: boolean;
}

function MenuItem({ icon: Icon, label, onClick, checked, destructive }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left transition-colors',
        destructive
          ? 'text-destructive hover:bg-destructive/10'
          : 'hover:bg-accent hover:text-accent-foreground',
      )}
    >
      <Icon className="size-3.5" />
      <span className="flex-1">{label}</span>
      {checked ? <span aria-hidden="true">✓</span> : null}
    </button>
  );
}

function MenuSeparator() {
  return <div role="separator" className="my-1 h-px bg-border" />;
}

// ── Selection-driven re-render ───────────────────────────────────────────

/** Subscribes the chrome React tree to editor selection / doc changes so
 *  the active column handle re-renders when the cursor moves. The snapshot
 *  is the editor's `state` object, which is reference-stable between
 *  transactions and replaced on each one — exactly what useSyncExternalStore
 *  needs to bail out vs. re-render. (Returning `Date.now()` here would
 *  loop infinitely; `editor.state` is the safe stable identity.) */
function useEditorTick(editor: Editor): unknown {
  return useSyncExternalStore(
    (cb) => {
      editor.on('selectionUpdate', cb);
      editor.on('transaction', cb);
      return () => {
        editor.off('selectionUpdate', cb);
        editor.off('transaction', cb);
      };
    },
    () => editor.state,
    () => editor.state,
  );
}

// ── Selection / measurement helpers ──────────────────────────────────────

/** Active column index inside the table at `getPos()`, or `null` when the
 *  cursor is in a different table or outside any table. */
function activeColumnInThisTable(
  editor: Editor,
  getPos: () => number | undefined,
): number | null {
  const myPos = getPos();
  if (typeof myPos !== 'number') return null;
  const $head = editor.state.selection.$head;
  let tableDepth = -1;
  let colIndex = -1;
  for (let d = $head.depth; d > 0; d--) {
    const n = $head.node(d);
    if (n.type.name === 'table') {
      tableDepth = d;
      break;
    }
    if (n.type.name === 'tableRow' && colIndex < 0) {
      colIndex = $head.index(d);
    }
  }
  if (tableDepth < 0 || colIndex < 0) return null;
  const tablePos = $head.before(tableDepth);
  if (tablePos !== myPos) return null;
  return colIndex;
}

/** Active row index inside the table at `getPos()`, or `null` otherwise. */
function activeRowInThisTable(
  editor: Editor,
  getPos: () => number | undefined,
): number | null {
  const myPos = getPos();
  if (typeof myPos !== 'number') return null;
  const $head = editor.state.selection.$head;
  for (let d = $head.depth; d > 0; d--) {
    const n = $head.node(d);
    if (n.type.name === 'table') {
      const tablePos = $head.before(d);
      if (tablePos !== myPos) return null;
      return $head.index(d);
    }
  }
  return null;
}

/** Place the cursor inside the LAST cell of the LAST row of THIS table.
 *  Used by the +column / +row bumpers so `addColumnAfter` / `addRowAfter`
 *  always operates on this table regardless of where the cursor was when
 *  the user clicked the bumper. */
function focusLastCellInTable(
  editor: Editor,
  getPos: () => number | undefined,
) {
  const tablePos = getPos();
  if (typeof tablePos !== 'number') return;
  const table = editor.state.doc.nodeAt(tablePos);
  if (!table) return;
  let rowOffset = tablePos + 1;
  let cellPos = -1;
  table.forEach((row) => {
    let cellOffset = rowOffset + 1;
    row.forEach((cell) => {
      cellPos = cellOffset + 1;
      cellOffset += cell.nodeSize;
    });
    rowOffset += row.nodeSize;
  });
  if (cellPos < 0) return;
  editor.chain().focus().setTextSelection(cellPos).run();
}

function readColumnAlignments(
  node: import('@tiptap/pm/model').Node,
): Array<ColumnAlign | null> {
  const firstRow = node.firstChild;
  if (!firstRow) return [];
  const out: Array<ColumnAlign | null> = [];
  firstRow.forEach((cell) => {
    const a = cell.attrs?.align;
    out.push(
      a === 'left' || a === 'center' || a === 'right' ? (a as ColumnAlign) : null,
    );
  });
  return out;
}

interface RectStyle {
  left?: string;
  width?: string;
  top?: string;
  height?: string;
}

function lookupTableWrapper(
  editor: Editor,
  getPos: () => number | undefined,
): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const pos = getPos();
  if (typeof pos !== 'number') return null;
  const tableDOM = editor.view.nodeDOM(pos);
  if (!(tableDOM instanceof HTMLElement)) return null;
  if (tableDOM.matches('[data-mdx-table]')) return tableDOM;
  return tableDOM.querySelector<HTMLElement>('[data-mdx-table]');
}

/** Measures one column post-layout, with re-measure on the wrapper's
 *  ResizeObserver. Single observer instance because we only ever pin one
 *  handle (the active column's). */
function useColumnRect(
  editor: Editor,
  getPos: () => number | undefined,
  index: number,
): RectStyle | null {
  const [rect, setRect] = useState<RectStyle | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const wrapper = lookupTableWrapper(editor, getPos);
      const cell = wrapper?.querySelector<HTMLElement>(
        `tr:first-child > :nth-child(${index + 1})`,
      );
      if (!wrapper || !cell) {
        setRect(null);
        return;
      }
      const cellRect = cell.getBoundingClientRect();
      const wrapRect = wrapper.getBoundingClientRect();
      setRect({
        left: `${cellRect.left - wrapRect.left}px`,
        width: `${cellRect.width}px`,
      });
    };
    measure();
    const wrapper = lookupTableWrapper(editor, getPos);
    if (!wrapper) return;
    const ro = new ResizeObserver(measure);
    ro.observe(wrapper);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  // Re-measure once after the next animation frame; covers the case where
  // the table's cells aren't laid out yet on first render (Tiptap mounts
  // contentDOM after our React render).
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const wrapper = lookupTableWrapper(editor, getPos);
      const cell = wrapper?.querySelector<HTMLElement>(
        `tr:first-child > :nth-child(${index + 1})`,
      );
      if (!wrapper || !cell) return;
      const cellRect = cell.getBoundingClientRect();
      const wrapRect = wrapper.getBoundingClientRect();
      setRect({
        left: `${cellRect.left - wrapRect.left}px`,
        width: `${cellRect.width}px`,
      });
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  return rect;
}

/** Mirror of `useColumnRect` for rows — pins the row handle to the row's
 *  vertical position. */
function useRowRect(
  editor: Editor,
  getPos: () => number | undefined,
  index: number,
): RectStyle | null {
  const [rect, setRect] = useState<RectStyle | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const wrapper = lookupTableWrapper(editor, getPos);
      const row = wrapper?.querySelector<HTMLElement>(
        `tr:nth-child(${index + 1})`,
      );
      if (!wrapper || !row) {
        setRect(null);
        return;
      }
      const rowRect = row.getBoundingClientRect();
      const wrapRect = wrapper.getBoundingClientRect();
      setRect({
        top: `${rowRect.top - wrapRect.top}px`,
        height: `${rowRect.height}px`,
      });
    };
    measure();
    const wrapper = lookupTableWrapper(editor, getPos);
    if (!wrapper) return;
    const ro = new ResizeObserver(measure);
    ro.observe(wrapper);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const wrapper = lookupTableWrapper(editor, getPos);
      const row = wrapper?.querySelector<HTMLElement>(
        `tr:nth-child(${index + 1})`,
      );
      if (!wrapper || !row) return;
      const rowRect = row.getBoundingClientRect();
      const wrapRect = wrapper.getBoundingClientRect();
      setRect({
        top: `${rowRect.top - wrapRect.top}px`,
        height: `${rowRect.height}px`,
      });
    });
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  return rect;
}

// ── Column align command ─────────────────────────────────────────────────

function setColumnAlign(
  editor: Editor,
  getPos: () => number | undefined,
  align: ColumnAlign,
) {
  const tablePos = getPos();
  if (typeof tablePos !== 'number') return;
  const { state, view } = editor;
  const table = state.doc.nodeAt(tablePos);
  if (!table) return;
  const $head = state.selection.$head;
  let colIndex = -1;
  for (let d = $head.depth; d > 0; d--) {
    if ($head.node(d).type.name === 'tableRow') {
      colIndex = $head.index(d);
      break;
    }
  }
  if (colIndex < 0) return;

  const tr = state.tr;
  let rowOffset = tablePos + 1;
  table.forEach((row) => {
    let cellOffset = rowOffset + 1;
    row.forEach((cell, _o, ci) => {
      if (ci === colIndex) {
        tr.setNodeMarkup(cellOffset, undefined, { ...cell.attrs, align });
      }
      cellOffset += cell.nodeSize;
    });
    rowOffset += row.nodeSize;
  });
  view.dispatch(tr);
}
