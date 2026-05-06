import { useEffect, useRef, useState } from 'react';
import { EllipsisVertical, GripVertical, Plus, X } from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { AttributesPopover } from '@/components/AttributesPopover';
import { AttributesForm } from '@/components/AttributesForm';
import { tabSchema } from '@/lib/blockSchemas/tab';
import { cn } from '@/lib/utils';

export const MdxTabs = Node.create({
  name: 'mdxTabs',
  group: 'block',
  content: 'mdxTab+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-mdx-tabs]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-tabs': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxTabsView);
  },
});

export const MdxTab = Node.create({
  name: 'mdxTab',
  group: 'mdxTabItem',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      title: { default: null },
      id: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-tab]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-tab': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxTabView);
  },
});

interface TabInfo {
  title: string;
  pos: number;
  size: number;
  index: number;
}

function MdxTabsView({ node, editor, getPos }: NodeViewProps) {
  const [active, setActive] = useState(0);
  const [attrOpen, setAttrOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const tabs: TabInfo[] = [];
  if (typeof getPos === 'function') {
    const start = getPos();
    if (start != null) {
      let cursor = start + 1;
      let i = 0;
      node.forEach((child) => {
        if (child.type.name === 'mdxTab') {
          tabs.push({
            title: (child.attrs.title as string | null) ?? '',
            pos: cursor,
            size: child.nodeSize,
            index: i,
          });
        }
        cursor += child.nodeSize;
        i++;
      });
    }
  }

  const clampedActive = tabs.length === 0 ? 0 : Math.min(active, tabs.length - 1);
  const activeTab = tabs[clampedActive];

  // Hide non-active panels imperatively. ProseMirror renders every mdxTab
  // child, and Tiptap may insert an extra wrapper between NodeViewContent's
  // className target and the rendered children — so we walk descendants
  // collecting the first `[data-mdx-tab]` on each subtree branch, stopping at
  // any nested `[data-mdx-tabs]` to avoid grabbing tabs inside nested groups.
  useEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;
    const container = root.querySelector('.mdx-tabs-panels');
    if (!container) return;
    const panels: HTMLElement[] = [];
    const walk = (node: Element) => {
      if (node !== container && node.matches('[data-mdx-tabs]')) return;
      if (node instanceof HTMLElement && node.dataset.mdxTab !== undefined) {
        panels.push(node);
        return;
      }
      for (const child of Array.from(node.children)) walk(child);
    };
    walk(container);
    panels.forEach((el, i) => {
      el.style.display = i === clampedActive ? '' : 'none';
    });
  });

  const updateTitle = (pos: number, nextTitle: string) => {
    editor
      .chain()
      .command(({ tr }) => {
        const child = tr.doc.nodeAt(pos);
        if (!child) return false;
        tr.setNodeMarkup(pos, undefined, {
          ...child.attrs,
          title: nextTitle || null,
        });
        return true;
      })
      .run();
  };

  const updateActiveTabAttrs = (patch: Record<string, unknown>) => {
    if (!activeTab) return;
    editor
      .chain()
      .command(({ tr }) => {
        const child = tr.doc.nodeAt(activeTab.pos);
        if (!child) return false;
        tr.setNodeMarkup(activeTab.pos, undefined, { ...child.attrs, ...patch });
        return true;
      })
      .run();
  };

  const removeTab = (index: number) => {
    const tab = tabs[index];
    if (!tab || tabs.length <= 1 || !editor.isEditable) return;
    editor
      .chain()
      .focus()
      .deleteRange({ from: tab.pos, to: tab.pos + tab.size })
      .run();
    if (active >= index && active > 0) setActive(active - 1);
  };

  const appendTab = () => {
    if (typeof getPos !== 'function' || !editor.isEditable) return;
    const start = getPos();
    if (start == null) return;
    const insertAt = start + node.nodeSize - 1;
    editor
      .chain()
      .focus()
      .insertContentAt(insertAt, {
        type: 'mdxTab',
        attrs: { title: null },
        content: [{ type: 'paragraph' }],
      })
      .run();
    setActive(tabs.length);
  };

  const moveTab = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const source = tabs[fromIndex];
    if (!source || !editor.isEditable) return;
    editor
      .chain()
      .command(({ tr }) => {
        const sourcePos = source.pos;
        const sourceNode = tr.doc.nodeAt(sourcePos);
        if (!sourceNode) return false;
        const slice = tr.doc.slice(sourcePos, sourcePos + sourceNode.nodeSize);
        tr.delete(sourcePos, sourcePos + sourceNode.nodeSize);
        // Recompute positions after the delete.
        const target = tabs[toIndex];
        if (!target) return false;
        let targetPos: number;
        if (toIndex > fromIndex) {
          targetPos = target.pos + target.size - sourceNode.nodeSize;
        } else {
          targetPos = target.pos;
        }
        tr.insert(targetPos, slice.content);
        return true;
      })
      .run();
    setActive(toIndex);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const fromId = e.active?.id;
    const toId = e.over?.id;
    if (typeof fromId !== 'number' || typeof toId !== 'number') return;
    if (fromId === toId) return;
    const fromIndex = tabs.findIndex((t) => t.pos === fromId);
    const toIndex = tabs.findIndex((t) => t.pos === toId);
    if (fromIndex < 0 || toIndex < 0) return;
    moveTab(fromIndex, toIndex);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    }),
  );

  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <NodeViewWrapper
      data-mdx-tabs=""
      className="my-4"
      ref={wrapperRef}
    >
      <div
        role="tablist"
        contentEditable={false}
        className="not-prose mb-4 flex min-w-full flex-none items-end gap-x-1 overflow-auto border-b border-stone-200 dark:border-stone-700"
      >
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <SortableContext
            items={tabs.map((t) => t.pos)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex items-end gap-x-1">
              {tabs.map((tab, i) => (
                <SortableTab
                  key={tab.pos}
                  tab={tab}
                  index={i}
                  isActive={i === clampedActive}
                  isOnly={tabs.length <= 1}
                  isEditable={editor.isEditable}
                  onActivate={() => setActive(i)}
                  onRename={(value) => updateTitle(tab.pos, value)}
                  onRemove={() => removeTab(i)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        {editor.isEditable ? (
          <button
            type="button"
            aria-label="Add tab"
            onMouseDown={stopPm}
            onClick={(e) => {
              stopPm(e);
              appendTab();
            }}
            className="-mb-px ml-auto flex size-7 items-center justify-center rounded-t border-b border-transparent text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200"
          >
            <Plus className="size-4" />
          </button>
        ) : null}
      </div>
      <div ref={panelRef} className="relative">
        <NodeViewContent className="mdx-tabs-panels" />
        {editor.isEditable && activeTab ? (
          <button
            type="button"
            aria-label="Edit tab attributes"
            onMouseDown={stopPm}
            onClick={(e) => {
              stopPm(e);
              setAttrOpen(true);
            }}
            contentEditable={false}
            className={cn(
              'absolute right-1 top-1 z-10 flex size-6 items-center justify-center rounded text-stone-400 transition-opacity dark:text-stone-500',
              'opacity-0 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200',
              '[[data-mdx-tabs]:hover_&]:opacity-100',
              attrOpen && 'opacity-100',
            )}
          >
            <EllipsisVertical className="size-4" />
          </button>
        ) : null}
      </div>
      {activeTab ? (
        <AttributesPopover
          open={attrOpen}
          onOpenChange={setAttrOpen}
          anchorEl={panelRef.current}
          title={tabSchema.title}
          titleIcon={tabSchema.headerIcon}
          onDelete={() => removeTab(clampedActive)}
        >
          <AttributesForm
            schema={tabSchema}
            values={
              (editor.state.doc.nodeAt(activeTab.pos)?.attrs ?? {}) as Record<
                string,
                unknown
              >
            }
            onChange={updateActiveTabAttrs}
          />
        </AttributesPopover>
      ) : null}
    </NodeViewWrapper>
  );
}

interface SortableTabProps {
  tab: TabInfo;
  index: number;
  isActive: boolean;
  isOnly: boolean;
  isEditable: boolean;
  onActivate: () => void;
  onRename: (value: string) => void;
  onRemove: () => void;
}

function SortableTab({
  tab,
  index,
  isActive,
  isOnly,
  isEditable,
  onActivate,
  onRename,
  onRemove,
}: SortableTabProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tab.pos });
  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();
  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
      className={cn(
        '-mb-px group/tab flex items-end gap-0.5 border-b transition-colors',
        isActive
          ? 'border-current text-stone-900 dark:text-stone-100'
          : 'border-transparent text-stone-600 dark:text-stone-400',
      )}
    >
      {isEditable ? (
        <button
          type="button"
          aria-label="Drag to reorder"
          onMouseDown={stopPm}
          {...listeners}
          {...attributes}
          className="mb-2.5 flex size-4 cursor-grab items-center justify-center text-stone-300 hover:text-stone-600 dark:text-stone-600 dark:hover:text-stone-300"
        >
          <GripVertical className="size-3.5" />
        </button>
      ) : null}
      <input
        role="tab"
        aria-selected={isActive}
        value={tab.title}
        placeholder={`Tab ${index + 1}`}
        onMouseDown={stopPm}
        onClick={(e) => {
          stopPm(e);
          onActivate();
        }}
        onFocus={onActivate}
        onChange={(e) => onRename(e.target.value)}
        className={cn(
          'border-0 bg-transparent px-1 pt-3 pb-2.5 text-sm font-semibold leading-6 outline-none placeholder:text-stone-400 dark:placeholder:text-stone-600',
          'hover:text-stone-900 dark:hover:text-stone-200',
        )}
        style={{ width: `${Math.max(tab.title.length, 4) + 1}ch` }}
      />
      {isEditable && !isOnly ? (
        <button
          type="button"
          aria-label="Remove tab"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            onRemove();
          }}
          className={cn(
            'mb-2.5 flex size-4 items-center justify-center rounded text-stone-400 opacity-0 transition-opacity',
            'group-hover/tab:opacity-100 hover:bg-destructive/10 hover:text-destructive',
          )}
        >
          <X className="size-3" />
        </button>
      ) : null}
    </div>
  );
}

function MdxTabView({ selected }: NodeViewProps) {
  return (
    <NodeViewWrapper
      data-mdx-tab=""
      className={cn(
        'prose dark:prose-invert',
        selected && 'rounded ring-2 ring-primary/40',
      )}
    >
      <NodeViewContent />
    </NodeViewWrapper>
  );
}
