import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import {
  ChevronRight,
  CircleAlert,
  CircleCheck,
  Copy,
  GripVertical,
  Info as InfoIcon,
  Lightbulb,
  MoreVertical,
  OctagonAlert,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import * as Popover from '@radix-ui/react-popover';
import type { Editor } from '@tiptap/react';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import type { CalloutVariant } from '@nebula-docs/components';
import { AttributesForm } from '@/components/AttributesForm';
import { AttributesPopover } from '@/components/AttributesPopover';
import { getBlockSchema, type BlockAttrSchema } from '@/lib/blockSchemas';
import { cn } from '@/lib/utils';

/**
 * Resolve a ProseMirror document position to the start position of the
 * containing top-level block. Handles two cases:
 *  - Cursor inside a normal block (depth ≥ 1): walk up to depth 1 and
 *    return the position before that ancestor.
 *  - Cursor inside an `atom: true` node like `mdxImportedSnippet` (which
 *    has no editable content): `posAtCoords` returns a depth-0 position
 *    sitting between blocks. Inspect `nodeAfter` / `nodeBefore` to pick
 *    up the surrounding atom block instead — without this, atom nodes
 *    have no drag handle and look "dead" in the editor.
 */
function resolveBlockPos(editor: Editor, pos: number): number | null {
  const $pos = editor.view.state.doc.resolve(pos);
  if ($pos.depth >= 1) return $pos.before(1);
  const after = $pos.nodeAfter;
  if (after && after.isBlock) return $pos.pos;
  const before = $pos.nodeBefore;
  if (before && before.isBlock) return $pos.pos - before.nodeSize;
  return null;
}

interface ActiveBlock {
  pos: number;
  node: ProseMirrorNode;
  rect: DOMRect;
}

interface DropTarget {
  pos: number;
  rect: DOMRect;
  before: boolean;
}

interface EditorWithBlockHandleProps {
  editor: Editor | null;
  children: ReactNode;
  className?: string;
}

const HOVER_LEAVE_DELAY_MS = 150;

export function EditorWithBlockHandle({
  editor,
  children,
  className,
}: EditorWithBlockHandleProps) {
  const [active, setActive] = useState<ActiveBlock | null>(null);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const [editing, setEditing] = useState<{
    blockPos: number;
    schema: BlockAttrSchema;
  } | null>(null);
  const [, forceEditingTick] = useReducer((n: number) => n + 1, 0);
  const containerRef = useRef<HTMLDivElement>(null);
  const handleAreaRef = useRef<HTMLDivElement>(null);
  const leaveTimerRef = useRef<number | null>(null);
  // Tracks whether the block-menu Popover is open. The Popover is portaled
  // outside the editor, so when it's taller than a short block (a single
  // line of text, a small heading) the cursor lands "outside the block"
  // as soon as the user reaches for Delete. Without freezing `active`,
  // the pointermove handler unmounts BlockHandleUI and closes the menu
  // before the click registers.
  const menuOpenRef = useRef(false);

  useEffect(() => {
    if (!editing || !editor) return;
    const handler = () => forceEditingTick();
    editor.on('transaction', handler);
    return () => {
      editor.off('transaction', handler);
    };
  }, [editor, editing]);

  useEffect(() => {
    if (!editing || !editor) return;
    const node = editor.view.state.doc.nodeAt(editing.blockPos);
    if (!node || node.type.name !== editing.schema.blockType) {
      setEditing(null);
    }
  }, [editing, editor]);

  const editingNode =
    editing && editor ? editor.view.state.doc.nodeAt(editing.blockPos) : null;
  const editingDom =
    editing && editor ? editor.view.nodeDOM(editing.blockPos) : null;
  const editingAnchor = editingDom instanceof HTMLElement ? editingDom : null;
  const editingAttrs = editingNode?.attrs ?? {};

  const applyEditingPatch = (patch: Record<string, unknown>) => {
    if (!editing || !editor) return;
    editor.commands.command(({ tr }) => {
      const node = tr.doc.nodeAt(editing.blockPos);
      if (!node) return false;
      tr.setNodeMarkup(editing.blockPos, undefined, { ...node.attrs, ...patch });
      return true;
    });
  };

  const deleteEditingBlock = () => {
    if (!editing || !editor) return;
    const node = editor.view.state.doc.nodeAt(editing.blockPos);
    if (!node) {
      setEditing(null);
      return;
    }
    editor
      .chain()
      .deleteRange({
        from: editing.blockPos,
        to: editing.blockPos + node.nodeSize,
      })
      .run();
    setEditing(null);
  };

  // Distance-based activation (no delay) so dragging starts immediately on
  // intent. The previous `delay: 200` made the handle feel laggy — users
  // would mash the grip and assume it wasn't responding. 4px tolerance is
  // tight enough that a single-click on the grip still passes through to
  // the kebab menu without spuriously starting a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  // Track the currently-dragging block so the DragOverlay can render a
  // ghost preview that follows the cursor. Without this, the user only
  // sees the row dim to 0.4 opacity in place — no visual feedback that
  // they're actually carrying anything.
  const [overlayHTML, setOverlayHTML] = useState<{
    html: string;
    width: number;
  } | null>(null);

  const handleDragStart = (e: DragStartEvent) => {
    if (!editor) return;
    const sourcePos = e.active?.id;
    if (typeof sourcePos !== 'number') return;
    const dom = editor.view.nodeDOM(sourcePos);
    if (!(dom instanceof HTMLElement)) return;
    const rect = dom.getBoundingClientRect();
    setOverlayHTML({ html: dom.outerHTML, width: rect.width });
  };

  useEffect(() => {
    if (!editor) return;

    const findBlockAt = (clientX: number, clientY: number): ActiveBlock | null => {
      const editorRect = editor.view.dom.getBoundingClientRect();
      if (clientY < editorRect.top || clientY > editorRect.bottom) return null;
      const probeX = Math.max(
        Math.min(clientX, editorRect.right - 8),
        editorRect.left + 8,
      );
      const result = editor.view.posAtCoords({ left: probeX, top: clientY });
      if (!result) return null;
      const blockPos = resolveBlockPos(editor, result.pos);
      if (blockPos === null) return null;
      const node = editor.view.state.doc.nodeAt(blockPos);
      if (!node) return null;
      const dom = editor.view.nodeDOM(blockPos);
      if (!(dom instanceof HTMLElement)) return null;
      return { pos: blockPos, node, rect: dom.getBoundingClientRect() };
    };

    const handler = (e: PointerEvent) => {
      // Freeze the active block while the menu is open. The Popover.Content
      // is portaled below the block, so moving the cursor into the menu
      // looks like "left the block" to this handler — without the freeze,
      // the BlockHandleUI unmounts and Delete becomes unclickable on any
      // block shorter than the menu.
      if (menuOpenRef.current) {
        if (leaveTimerRef.current !== null) {
          window.clearTimeout(leaveTimerRef.current);
          leaveTimerRef.current = null;
        }
        return;
      }

      const overEl = (el: HTMLElement | null) => {
        if (!el) return false;
        if (el.contains(e.target as Node)) return true;
        const r = el.getBoundingClientRect();
        return (
          e.clientX >= r.left &&
          e.clientX <= r.right &&
          e.clientY >= r.top &&
          e.clientY <= r.bottom
        );
      };
      const overHandle = overEl(handleAreaRef.current);

      if (overHandle) {
        if (leaveTimerRef.current !== null) {
          window.clearTimeout(leaveTimerRef.current);
          leaveTimerRef.current = null;
        }
        return;
      }

      const found = findBlockAt(e.clientX, e.clientY);
      if (found) {
        if (leaveTimerRef.current !== null) {
          window.clearTimeout(leaveTimerRef.current);
          leaveTimerRef.current = null;
        }
        setActive((prev) => {
          if (prev && prev.pos === found.pos) {
            return prev.rect.top === found.rect.top &&
              prev.rect.height === found.rect.height
              ? prev
              : found;
          }
          return found;
        });
      } else {
        if (leaveTimerRef.current === null) {
          leaveTimerRef.current = window.setTimeout(() => {
            setActive(null);
            leaveTimerRef.current = null;
          }, HOVER_LEAVE_DELAY_MS);
        }
      }
    };

    document.addEventListener('pointermove', handler);
    return () => {
      document.removeEventListener('pointermove', handler);
      if (leaveTimerRef.current !== null) {
        window.clearTimeout(leaveTimerRef.current);
      }
    };
  }, [editor]);

  const handleDragMove = (e: DragMoveEvent) => {
    if (!editor) return;
    const activator = e.activatorEvent as PointerEvent;
    const cursorY = activator.clientY + e.delta.y;
    const editorRect = editor.view.dom.getBoundingClientRect();
    const probeX = editorRect.left + Math.min(80, editorRect.width / 2);
    const result = editor.view.posAtCoords({ left: probeX, top: cursorY });
    if (!result) {
      setDropTarget(null);
      return;
    }
    const blockPos = resolveBlockPos(editor, result.pos);
    if (blockPos === null) return;
    const node = editor.view.state.doc.nodeAt(blockPos);
    if (!node) return;
    const dom = editor.view.nodeDOM(blockPos);
    if (!(dom instanceof HTMLElement)) return;
    const rect = dom.getBoundingClientRect();
    const before = cursorY < rect.top + rect.height / 2;
    setDropTarget((prev) => {
      if (
        prev &&
        prev.pos === blockPos &&
        prev.before === before &&
        prev.rect.top === rect.top
      ) {
        return prev;
      }
      return { pos: blockPos, rect, before };
    });
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const sourceId = e.active?.id;
    const target = dropTarget;
    setDropTarget(null);
    setOverlayHTML(null);
    if (typeof sourceId !== 'number' || !target || !editor) return;
    const sourcePos = sourceId;
    const sourceNode = editor.view.state.doc.nodeAt(sourcePos);
    if (!sourceNode) return;
    let targetPos = target.pos;
    if (!target.before) {
      const targetNode = editor.view.state.doc.nodeAt(target.pos);
      if (targetNode) targetPos += targetNode.nodeSize;
    }
    if (
      targetPos === sourcePos ||
      targetPos === sourcePos + sourceNode.nodeSize
    ) {
      return;
    }
    editor.commands.command(({ tr }) => {
      const slice = tr.doc.slice(sourcePos, sourcePos + sourceNode.nodeSize);
      tr.delete(sourcePos, sourcePos + sourceNode.nodeSize);
      let adjusted = targetPos;
      if (targetPos > sourcePos) adjusted -= sourceNode.nodeSize;
      tr.insert(adjusted, slice.content);
      return true;
    });
  };

  const editable = editor?.isEditable ?? false;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setDropTarget(null);
        setOverlayHTML(null);
      }}
    >
      <div ref={containerRef} className={cn('relative', className)}>
        {children}
        {editable && active && editor ? (
          <BlockHandleUI
            key={active.pos}
            editor={editor}
            block={active}
            containerRef={containerRef}
            handleAreaRef={handleAreaRef}
            menuOpenRef={menuOpenRef}
            onOpenEdit={(blockPos, schema) =>
              setEditing({ blockPos, schema })
            }
          />
        ) : null}
        {dropTarget ? (
          <DropIndicator dropTarget={dropTarget} containerRef={containerRef} />
        ) : null}
      </div>
      <DragOverlay dropAnimation={null}>
        {overlayHTML ? (
          <div
            // Render the dragged block's HTML as a ghost that follows the
            // cursor. It's a static clone (no event handlers, no Tiptap
            // state), so it renders fine even though the live block is
            // dimmed in place.
            className="pointer-events-none rounded-md border border-border/60 bg-background/95 px-3 py-2 text-sm shadow-xl ring-1 ring-primary/30 backdrop-blur-sm"
            style={{ width: overlayHTML.width }}
            dangerouslySetInnerHTML={{ __html: overlayHTML.html }}
          />
        ) : null}
      </DragOverlay>
      {editing && editor ? (
        <AttributesPopover
          open={!!editing}
          onOpenChange={(next) => {
            if (!next) setEditing(null);
          }}
          anchorEl={editingAnchor}
          title={editing.schema.title}
          titleIcon={editing.schema.headerIcon}
          onDelete={deleteEditingBlock}
        >
          <AttributesForm
            schema={editing.schema}
            values={editingAttrs}
            onChange={applyEditingPatch}
          />
        </AttributesPopover>
      ) : null}
    </DndContext>
  );
}

function BlockHandleUI({
  editor,
  block,
  containerRef,
  handleAreaRef,
  menuOpenRef,
  onOpenEdit,
}: {
  editor: Editor;
  block: ActiveBlock;
  containerRef: React.RefObject<HTMLDivElement | null>;
  handleAreaRef: React.RefObject<HTMLDivElement | null>;
  menuOpenRef: React.RefObject<boolean>;
  onOpenEdit: (blockPos: number, schema: BlockAttrSchema) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => {
    menuOpenRef.current = menuOpen;
    return () => {
      menuOpenRef.current = false;
    };
  }, [menuOpen, menuOpenRef]);
  const wasDraggingRef = useRef(false);
  const dragId = block.pos;
  const schema = getBlockSchema(block.node.type.name);

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: dragId,
  });

  useEffect(() => {
    if (isDragging) {
      wasDraggingRef.current = true;
    } else if (wasDraggingRef.current) {
      const t = window.setTimeout(() => {
        wasDraggingRef.current = false;
      }, 80);
      return () => window.clearTimeout(t);
    }
  }, [isDragging]);

  const containerRect = containerRef.current?.getBoundingClientRect();
  if (!containerRect) return null;

  const top = block.rect.top - containerRect.top;
  // Two size-7 buttons (28px) + 2px gap = 58px, plus 6px slack so the
  // handle doesn't crowd the block. Bumped from size-6 / 56px so the
  // grip is easier to land on — the previous ~24px target was the main
  // source of "missed grabs" when the user reached for it.
  const HANDLE_W = 64;
  // Handles intentionally render outside the prose container (negative
  // left for the +/grip, beyond-right for the kebab). The container is
  // `overflow: visible`, so the absolute children paint into the
  // surrounding editor canvas margin instead of stealing gutter from
  // the writing area.
  const left = block.rect.left - containerRect.left - HANDLE_W;
  const rightLeft = block.rect.right - containerRect.left + 8;

  const insertBelow = () => {
    const insertPos = block.pos + block.node.nodeSize;
    // Insert a fresh paragraph containing `/` so the slash menu opens
    // immediately. The suggestion plugin keys off the `/` character at the
    // cursor; the user can type to filter or press Escape to dismiss.
    editor
      .chain()
      .focus()
      .insertContentAt(insertPos, {
        type: 'paragraph',
        content: [{ type: 'text', text: '/' }],
      })
      .setTextSelection(insertPos + 2)
      .run();
  };

  const handleGripClick = (e: ReactMouseEvent) => {
    if (wasDraggingRef.current) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    setMenuOpen((prev) => !prev);
  };

  return (
    <>
      <div
        ref={handleAreaRef}
        className={cn(
          'absolute z-30 flex items-center gap-0.5 text-muted-foreground',
          isDragging ? 'opacity-30' : 'opacity-100',
          'transition-opacity',
        )}
        style={{ top, left, height: Math.min(block.rect.height, 28) }}
      >
        <button
          type="button"
          aria-label="Insert paragraph below"
          className="flex size-7 items-center justify-center rounded hover:bg-accent hover:text-foreground"
          onClick={insertBelow}
        >
          <Plus className="size-4" />
        </button>
        <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Popover.Anchor asChild>
            <div
              ref={setNodeRef}
              {...listeners}
              {...attributes}
              role="button"
              tabIndex={0}
              aria-label="Drag or open block menu"
              className={cn(
                'flex size-7 cursor-grab select-none items-center justify-center rounded outline-none',
                'hover:bg-accent hover:text-foreground active:cursor-grabbing',
              )}
              onClick={handleGripClick}
            >
              <GripVertical className="pointer-events-none size-4" />
            </div>
          </Popover.Anchor>
          <Popover.Portal>
            <Popover.Content
              sideOffset={4}
              align="start"
              className={cn(
                'z-50 min-w-[180px] rounded-md border bg-popover p-1 shadow-md',
                'data-[state=open]:animate-in data-[state=closed]:animate-out',
                'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
                'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
              )}
              onCloseAutoFocus={(e) => e.preventDefault()}
            >
              <BlockMenu
                editor={editor}
                block={block}
                onClose={() => setMenuOpen(false)}
              />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>
      {schema && !schema.inlinePopover ? (
        <div
          className={cn(
            'absolute z-30 flex items-center text-muted-foreground',
            isDragging ? 'opacity-30' : 'opacity-100',
            'transition-opacity',
          )}
          style={{ top, left: rightLeft, height: Math.min(block.rect.height, 28) }}
        >
          <button
            type="button"
            aria-label={`Open ${schema.title}`}
            className="flex size-6 items-center justify-center rounded hover:bg-accent hover:text-foreground"
            onClick={() => onOpenEdit(block.pos, schema)}
          >
            <MoreVertical className="size-4" />
          </button>
        </div>
      ) : null}
    </>
  );
}

function DropIndicator({
  dropTarget,
  containerRef,
}: {
  dropTarget: DropTarget;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  const containerRect = containerRef.current?.getBoundingClientRect();
  if (!containerRect) return null;
  const lineY = dropTarget.before
    ? dropTarget.rect.top - containerRect.top
    : dropTarget.rect.bottom - containerRect.top;
  const left = dropTarget.rect.left - containerRect.left;
  return (
    <div
      className="pointer-events-none absolute z-20 h-0.5 rounded-full bg-primary"
      style={{
        top: lineY - 1,
        left,
        width: dropTarget.rect.width,
      }}
    />
  );
}

const CALLOUT_VARIANTS: ReadonlyArray<{
  value: CalloutVariant;
  label: string;
  Icon: typeof InfoIcon;
}> = [
  { value: 'info', label: 'Info', Icon: InfoIcon },
  { value: 'check', label: 'Check', Icon: CircleCheck },
  { value: 'note', label: 'Note', Icon: CircleAlert },
  { value: 'tip', label: 'Tip', Icon: Lightbulb },
  { value: 'warning', label: 'Warning', Icon: TriangleAlert },
  { value: 'danger', label: 'Danger', Icon: OctagonAlert },
  { value: 'custom', label: 'Custom', Icon: Pencil },
];

function BlockMenu({
  editor,
  block,
  onClose,
}: {
  editor: Editor;
  block: ActiveBlock;
  onClose: () => void;
}) {
  const [submenu, setSubmenu] = useState<'change-to' | null>(null);
  const isCallout = block.node.type.name === 'mdxCallout';

  const items = useMemo(() => {
    const list: Array<
      | { kind: 'item'; label: string; Icon?: typeof InfoIcon; onClick: () => void; submenuKey?: 'change-to' }
      | { kind: 'separator' }
    > = [];
    if (isCallout) {
      list.push({
        kind: 'item',
        label: 'Change to',
        Icon: ChevronRight,
        submenuKey: 'change-to',
        onClick: () => setSubmenu('change-to'),
      });
      list.push({ kind: 'separator' });
    }
    list.push({
      kind: 'item',
      label: 'Duplicate',
      Icon: Copy,
      onClick: () => {
        editor
          .chain()
          .focus()
          .insertContentAt(block.pos + block.node.nodeSize, block.node.toJSON())
          .run();
        onClose();
      },
    });
    list.push({
      kind: 'item',
      label: 'Delete',
      Icon: Trash2,
      onClick: () => {
        editor
          .chain()
          .focus()
          .deleteRange({ from: block.pos, to: block.pos + block.node.nodeSize })
          .run();
        onClose();
      },
    });
    return list;
  }, [editor, block, isCallout, onClose]);

  if (submenu === 'change-to') {
    const currentVariant = block.node.attrs.variant as CalloutVariant;
    return (
      <div className="flex flex-col gap-0.5">
        <button
          type="button"
          className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-muted-foreground hover:bg-accent"
          onClick={() => setSubmenu(null)}
        >
          <ChevronRight className="size-4 rotate-180" />
          Back
        </button>
        <div className="px-2 pt-1 pb-0.5 text-xs text-muted-foreground">
          Change to
        </div>
        {CALLOUT_VARIANTS.map(({ value, label, Icon }) => (
          <button
            key={value}
            type="button"
            className={cn(
              'flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent',
              value === currentVariant && 'bg-accent',
            )}
            onClick={() => {
              editor
                .chain()
                .focus()
                .setNodeSelection(block.pos)
                .updateAttributes('mdxCallout', { variant: value })
                .run();
              onClose();
            }}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item, i) => {
        if (item.kind === 'separator') {
          return <div key={i} className="my-1 h-px bg-border" />;
        }
        const Icon = item.Icon;
        return (
          <button
            key={i}
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={item.onClick}
          >
            <span className="flex items-center gap-2">
              {Icon && item.label !== 'Change to' ? (
                <Icon className="size-4" />
              ) : null}
              {item.label}
            </span>
            {item.submenuKey ? <ChevronRight className="size-4" /> : null}
          </button>
        );
      })}
    </div>
  );
}
