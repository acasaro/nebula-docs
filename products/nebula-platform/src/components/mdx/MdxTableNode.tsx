import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { Table } from '@tiptap/extension-table';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableRow } from '@tiptap/extension-table-row';
import { Fragment } from '@tiptap/pm/model';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Copy,
  EllipsisVertical,
  GripVertical,
  Plus,
  Trash2,
  type LucideIcon,
} from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { useEffect, useLayoutEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/**
 * GFM-compatible table editing — Tiptap's table extensions plus a custom
 * NodeView that overlays Mintlify-style affordances:
 *
 *  • Floating `+` bumpers on the right (add column at end) and bottom
 *    (add row at end), revealed on table hover.
 *  • Per-column dot handles above each column header — click for an
 *    insert / move / align / copy / delete menu.
 *  • Per-row dot handles to the left of each body row — same menu shape.
 *
 * Data model is plain GFM: parser reads `mdast.table` → Tiptap `table`
 * with column-alignment denormalized onto each cell's `align` attr;
 * serializer emits `| --- |` markdown back. No `<Table>` JSX component.
 */

const COLUMN_ALIGN_VALUES = ['left', 'center', 'right'] as const;
type ColumnAlign = (typeof COLUMN_ALIGN_VALUES)[number];

/** Adds an `align` attribute to a cell type so the column-align menu can
 *  persist its choice across save+reload. Same shape on header + body. */
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
            return {
              'data-align': a,
              style: `text-align: ${a};`,
            };
          },
        },
      };
    },
  }) as T;
}

export const MdxTable = Table.extend({
  // NodeViewContent's `as="table"` inside the React view is the content
  // DOM — no need to also set contentDOMElementTag here, which would
  // create a second wrapping `<table>` and nest the editable rows inside
  // a non-editable outer table.
  addNodeView() {
    return ReactNodeViewRenderer(MdxTableView);
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

// ── NodeView ─────────────────────────────────────────────────────────────

function MdxTableView({ editor, getPos, node }: NodeViewProps) {
  const colCount = node.firstChild?.childCount ?? 0;
  const rowCount = node.childCount;
  const alignments = readColumnAlignments(node);

  return (
    <NodeViewWrapper data-mdx-table="" className="group/table relative my-4">
      <div className="overflow-x-auto rounded-lg border border-border/50">
        <NodeViewContent as="table" className="mdx-table w-full border-collapse" />
      </div>

      <BumperButton
        ariaLabel="Add column"
        className="absolute -right-3 top-1/2 -translate-y-1/2"
        onClick={() => editor.chain().focus().addColumnAfter().run()}
      />
      <BumperButton
        ariaLabel="Add row"
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2"
        onClick={() => editor.chain().focus().addRowAfter().run()}
      />

      <ColumnHandles
        editor={editor}
        getPos={getPos}
        colCount={colCount}
        alignments={alignments}
      />
      <RowHandles editor={editor} getPos={getPos} rowCount={rowCount} />
    </NodeViewWrapper>
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
        'flex size-6 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground shadow-sm transition-all',
        'opacity-0 group-hover/table:opacity-100 hover:bg-accent hover:text-foreground',
        className,
      )}
    >
      <Plus className="size-3.5" />
    </button>
  );
}

// ── Column handles ───────────────────────────────────────────────────────

interface ColumnHandlesProps {
  editor: NodeViewProps['editor'];
  getPos: NodeViewProps['getPos'];
  colCount: number;
  alignments: Array<ColumnAlign | null>;
}

function ColumnHandles({
  editor,
  getPos,
  colCount,
  alignments,
}: ColumnHandlesProps) {
  const [activeCol, setActiveCol] = useState<number | null>(null);
  if (colCount === 0) return null;

  return (
    <div
      contentEditable={false}
      className="pointer-events-none absolute inset-x-0 top-0 z-10 -mt-3 h-3"
    >
      <div className="relative h-full">
        {Array.from({ length: colCount }).map((_, i) => (
          <ColumnHandle
            key={i}
            editor={editor}
            getPos={getPos}
            index={i}
            menuOpen={activeCol === i}
            onMenuOpenChange={(open) => setActiveCol(open ? i : null)}
            currentAlign={alignments[i] ?? null}
          />
        ))}
      </div>
    </div>
  );
}

interface ColumnHandleProps {
  editor: NodeViewProps['editor'];
  getPos: NodeViewProps['getPos'];
  index: number;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
  currentAlign: ColumnAlign | null;
}

function ColumnHandle({
  editor,
  getPos,
  index,
  menuOpen,
  onMenuOpenChange,
  currentAlign,
}: ColumnHandleProps) {
  const rect = useColumnRect(editor, getPos, index);
  if (!rect) return null;

  const focusColumn = () => focusCellAt(editor, getPos, 0, index);
  const close = () => onMenuOpenChange(false);
  const run = (fn: () => unknown) => {
    focusColumn();
    fn();
    close();
  };

  return (
    <Popover.Root open={menuOpen} onOpenChange={onMenuOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`Column ${index + 1} options`}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            focusColumn();
            onMenuOpenChange(true);
          }}
          className={cn(
            'pointer-events-auto absolute flex h-3 items-center justify-center rounded-t-md border border-b-0 border-border/60 bg-background text-muted-foreground shadow-sm transition-opacity',
            // Reveal on table hover (matches the bumper bumpers' opacity
            // gating); pinned visible while the menu for THIS column is open.
            'opacity-0 group-hover/table:opacity-100 hover:bg-accent hover:text-foreground',
            menuOpen && 'bg-accent text-foreground opacity-100',
          )}
          style={rect}
        >
          <GripVertical className="size-3 rotate-90" />
        </button>
      </Popover.Trigger>
      <PopoverMenu>
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
        <MenuItem
          icon={ArrowLeft}
          label="Move left"
          onClick={() => run(() => moveColumn(editor, getPos, -1))}
        />
        <MenuItem
          icon={ArrowRight}
          label="Move right"
          onClick={() => run(() => moveColumn(editor, getPos, +1))}
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
          icon={Copy}
          label="Copy column"
          onClick={() => run(() => copyColumn(editor, getPos))}
        />
        <MenuItem
          icon={Trash2}
          label="Delete column"
          destructive
          onClick={() => run(() => editor.chain().focus().deleteColumn().run())}
        />
      </PopoverMenu>
    </Popover.Root>
  );
}

// ── Row handles ──────────────────────────────────────────────────────────

interface RowHandlesProps {
  editor: NodeViewProps['editor'];
  getPos: NodeViewProps['getPos'];
  rowCount: number;
}

function RowHandles({ editor, getPos, rowCount }: RowHandlesProps) {
  const [activeRow, setActiveRow] = useState<number | null>(null);
  if (rowCount === 0) return null;

  return (
    <div
      contentEditable={false}
      className="pointer-events-none absolute inset-y-0 left-0 z-10 -ml-3 w-3"
    >
      <div className="relative h-full">
        {Array.from({ length: rowCount }).map((_, i) => (
          <RowHandle
            key={i}
            editor={editor}
            getPos={getPos}
            index={i}
            isHeader={i === 0}
            menuOpen={activeRow === i}
            onMenuOpenChange={(open) => setActiveRow(open ? i : null)}
          />
        ))}
      </div>
    </div>
  );
}

interface RowHandleProps {
  editor: NodeViewProps['editor'];
  getPos: NodeViewProps['getPos'];
  index: number;
  isHeader: boolean;
  menuOpen: boolean;
  onMenuOpenChange: (open: boolean) => void;
}

function RowHandle({
  editor,
  getPos,
  index,
  isHeader,
  menuOpen,
  onMenuOpenChange,
}: RowHandleProps) {
  const rect = useRowRect(editor, getPos, index);
  if (!rect || isHeader) return null;

  const focusRow = () => focusCellAt(editor, getPos, index, 0);
  const close = () => onMenuOpenChange(false);
  const run = (fn: () => unknown) => {
    focusRow();
    fn();
    close();
  };

  return (
    <Popover.Root open={menuOpen} onOpenChange={onMenuOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`Row ${index} options`}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            focusRow();
            onMenuOpenChange(true);
          }}
          className={cn(
            'pointer-events-auto absolute flex w-3 items-center justify-center rounded-l-md border border-r-0 border-border/60 bg-background text-muted-foreground shadow-sm transition-opacity',
            'opacity-0 group-hover/table:opacity-100 hover:bg-accent hover:text-foreground',
            menuOpen && 'bg-accent text-foreground opacity-100',
          )}
          style={rect}
        >
          <EllipsisVertical className="size-3" />
        </button>
      </Popover.Trigger>
      <PopoverMenu>
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
        <MenuItem
          icon={ArrowUp}
          label="Move up"
          onClick={() => run(() => moveRow(editor, getPos, -1))}
        />
        <MenuItem
          icon={ArrowDown}
          label="Move down"
          onClick={() => run(() => moveRow(editor, getPos, +1))}
        />
        <MenuSeparator />
        <MenuItem
          icon={Copy}
          label="Copy row"
          onClick={() => run(() => copyRow(editor, getPos))}
        />
        <MenuItem
          icon={Trash2}
          label="Delete row"
          destructive
          onClick={() => run(() => editor.chain().focus().deleteRow().run())}
        />
      </PopoverMenu>
    </Popover.Root>
  );
}

// ── Menu primitives ──────────────────────────────────────────────────────

function PopoverMenu({ children }: { children: React.ReactNode }) {
  return (
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
        {children}
      </Popover.Content>
    </Popover.Portal>
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

// ── DOM measurement helpers ──────────────────────────────────────────────

interface RectStyle {
  left?: string;
  width?: string;
  top?: string;
  height?: string;
}

/** Resolves to the `<div data-mdx-table>` for this specific NodeView.
 *  ReactNodeViewRenderer wraps the React tree in a `.react-renderer`
 *  outer div which is what `view.nodeDOM(pos)` returns; our NodeViewWrapper
 *  with `data-mdx-table` is a child. Plain function (not a hook) — called
 *  from effects, not from render. */
function lookupTableWrapper(
  editor: AnyEditor,
  getPos: NodeViewProps['getPos'],
): HTMLElement | null {
  if (typeof document === 'undefined') return null;
  const pos = getPos?.();
  if (typeof pos !== 'number') return null;
  const tableDOM = editor.view.nodeDOM(pos);
  if (!(tableDOM instanceof HTMLElement)) return null;
  if (tableDOM.matches('[data-mdx-table]')) return tableDOM;
  return tableDOM.querySelector<HTMLElement>('[data-mdx-table]');
}

/**
 * Measures the column / row at `index` post-layout. Returns null on first
 * render (the wrapper or its cells aren't in the DOM yet) and again on
 * each layout change so the handle re-anchors when columns are added /
 * removed / resized. Uses `useLayoutEffect` so the measurement happens
 * before the browser paints — no flash of mispositioned handles.
 */
function useColumnRect(
  editor: AnyEditor,
  getPos: NodeViewProps['getPos'],
  index: number,
): RectStyle | null {
  const [rect, setRect] = useState<RectStyle | null>(null);
  useLayoutEffect(() => {
    const update = () => {
      const wrapper = lookupTableWrapper(editor, getPos);
      if (!wrapper) {
        setRect(null);
        return;
      }
      const cell = wrapper.querySelector<HTMLElement>(
        `tr:first-child > :nth-child(${index + 1})`,
      );
      if (!cell) {
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
    update();
    // Re-measure on viewport changes — the table can reflow when the
    // sidebar widens / narrows or the window resizes.
    const ro = new ResizeObserver(update);
    const wrapper = lookupTableWrapper(editor, getPos);
    if (wrapper) ro.observe(wrapper);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
    };
    // editor + getPos are stable refs across renders for a given NodeView;
    // index is the only thing that varies per handle instance.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);
  // Re-measure once more after a microtask in case the table content
  // landed asynchronously (Tiptap's contentDOM mounts after our React
  // render). useEffect runs after paint; useLayoutEffect already fired,
  // but a second pass catches the case where the cells weren't there yet.
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

function useRowRect(
  editor: AnyEditor,
  getPos: NodeViewProps['getPos'],
  index: number,
): RectStyle | null {
  const [rect, setRect] = useState<RectStyle | null>(null);
  useLayoutEffect(() => {
    const update = () => {
      const wrapper = lookupTableWrapper(editor, getPos);
      if (!wrapper) {
        setRect(null);
        return;
      }
      const row = wrapper.querySelector<HTMLElement>(
        `tr:nth-child(${index + 1})`,
      );
      if (!row) {
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
    update();
    const ro = new ResizeObserver(update);
    const wrapper = lookupTableWrapper(editor, getPos);
    if (wrapper) ro.observe(wrapper);
    window.addEventListener('resize', update);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', update);
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

// ── Tiptap command shims ─────────────────────────────────────────────────

type AnyEditor = NodeViewProps['editor'];

function readColumnAlignments(node: NodeViewProps['node']): Array<ColumnAlign | null> {
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

/** Move the selection into the cell at (rowIndex, colIndex) inside the
 *  table whose top-level position is `getPos()`. */
function focusCellAt(
  editor: AnyEditor,
  getPos: NodeViewProps['getPos'],
  rowIndex: number,
  colIndex: number,
) {
  const tablePos = getPos?.();
  if (typeof tablePos !== 'number') return;
  const table = editor.state.doc.nodeAt(tablePos);
  if (!table) return;
  let rowOffset = tablePos + 1;
  let target = -1;
  table.forEach((row, _o, ri) => {
    if (ri === rowIndex) {
      let cellOffset = rowOffset + 1;
      row.forEach((cell, _co, ci) => {
        if (ci === colIndex) target = cellOffset + 1;
        cellOffset += cell.nodeSize;
      });
    }
    rowOffset += row.nodeSize;
  });
  if (target < 0) return;
  editor.chain().focus().setTextSelection(target).run();
}

function setColumnAlign(
  editor: AnyEditor,
  getPos: NodeViewProps['getPos'],
  align: ColumnAlign,
) {
  const tablePos = getPos?.();
  if (typeof tablePos !== 'number') return;
  const { state, view } = editor;
  const table = state.doc.nodeAt(tablePos);
  if (!table) return;
  const colIndex = activeColumnIndex(state.selection.$head);
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

function activeColumnIndex($head: import('@tiptap/pm/state').Selection['$head']): number {
  for (let d = $head.depth; d > 0; d--) {
    if ($head.node(d).type.name === 'tableRow') return $head.index(d);
  }
  return -1;
}

function activeRowIndex($head: import('@tiptap/pm/state').Selection['$head']): number {
  for (let d = $head.depth; d > 0; d--) {
    if ($head.node(d).type.name === 'table') return $head.index(d);
  }
  return -1;
}

function moveColumn(
  editor: AnyEditor,
  getPos: NodeViewProps['getPos'],
  delta: -1 | 1,
) {
  const tablePos = getPos?.();
  if (typeof tablePos !== 'number') return;
  const { state, view } = editor;
  const table = state.doc.nodeAt(tablePos);
  if (!table) return;
  const colIndex = activeColumnIndex(state.selection.$head);
  if (colIndex < 0) return;
  const colCount = table.firstChild?.childCount ?? 0;
  const target = colIndex + delta;
  if (target < 0 || target >= colCount) return;

  // Build a new table with each row's column at colIndex/target swapped.
  const newRows: Array<ReturnType<typeof table.firstChild>> = [];
  table.forEach((row) => {
    const cells: Array<ReturnType<typeof table.firstChild>> = [];
    row.forEach((cell) => cells.push(cell));
    [cells[colIndex], cells[target]] = [cells[target], cells[colIndex]];
    newRows.push(row.type.create(row.attrs, Fragment.fromArray(cells)));
  });
  const newTable = table.type.create(table.attrs, Fragment.fromArray(newRows));
  view.dispatch(state.tr.replaceWith(tablePos, tablePos + table.nodeSize, newTable));
}

function moveRow(
  editor: AnyEditor,
  getPos: NodeViewProps['getPos'],
  delta: -1 | 1,
) {
  const tablePos = getPos?.();
  if (typeof tablePos !== 'number') return;
  const { state, view } = editor;
  const table = state.doc.nodeAt(tablePos);
  if (!table) return;
  const rowIndex = activeRowIndex(state.selection.$head);
  if (rowIndex <= 0) return; // header (index 0) stays put
  const target = rowIndex + delta;
  if (target <= 0 || target >= table.childCount) return;

  const rows: Array<ReturnType<typeof table.firstChild>> = [];
  table.forEach((row) => rows.push(row));
  [rows[rowIndex], rows[target]] = [rows[target], rows[rowIndex]];
  const newTable = table.type.create(table.attrs, Fragment.fromArray(rows));
  view.dispatch(state.tr.replaceWith(tablePos, tablePos + table.nodeSize, newTable));
}

function copyColumn(editor: AnyEditor, getPos: NodeViewProps['getPos']) {
  // Insert a fresh column after the active one, then write each cell's
  // content into the matching cell of the new column.
  const colIndex = activeColumnIndex(editor.state.selection.$head);
  if (colIndex < 0) return;
  editor.chain().focus().addColumnAfter().run();

  const tablePos = getPos?.();
  if (typeof tablePos !== 'number') return;
  const { state, view } = editor;
  const table = state.doc.nodeAt(tablePos);
  if (!table) return;
  const tr = state.tr;
  let rowOffset = tablePos + 1;
  table.forEach((row) => {
    let cellOffset = rowOffset + 1;
    let sourceCell: ReturnType<typeof table.firstChild> | null = null;
    let destStart = -1;
    let destEnd = -1;
    row.forEach((cell, _o, ci) => {
      if (ci === colIndex) sourceCell = cell;
      if (ci === colIndex + 1) {
        destStart = cellOffset + 1;
        destEnd = cellOffset + cell.nodeSize - 1;
      }
      cellOffset += cell.nodeSize;
    });
    if (sourceCell && destStart >= 0) {
      tr.replaceWith(destStart, destEnd, sourceCell.content);
    }
    rowOffset += row.nodeSize;
  });
  view.dispatch(tr);
}

function copyRow(editor: AnyEditor, getPos: NodeViewProps['getPos']) {
  const rowIndex = activeRowIndex(editor.state.selection.$head);
  if (rowIndex < 0) return;
  editor.chain().focus().addRowAfter().run();

  const tablePos = getPos?.();
  if (typeof tablePos !== 'number') return;
  const { state, view } = editor;
  const table = state.doc.nodeAt(tablePos);
  if (!table) return;
  const tr = state.tr;
  let rowOffset = tablePos + 1;
  let sourceRow: ReturnType<typeof table.firstChild> | null = null;
  let destStart = -1;
  let destEnd = -1;
  table.forEach((row, _o, ri) => {
    if (ri === rowIndex) sourceRow = row;
    if (ri === rowIndex + 1) {
      destStart = rowOffset + 1;
      destEnd = rowOffset + row.nodeSize - 1;
    }
    rowOffset += row.nodeSize;
  });
  if (sourceRow && destStart >= 0) {
    tr.replaceWith(destStart, destEnd, sourceRow.content);
  }
  view.dispatch(tr);
}
