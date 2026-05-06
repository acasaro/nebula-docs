import { useRef, useState } from 'react';
import { EllipsisVertical, Plus } from 'lucide-react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { AttributesPopover } from '@/components/AttributesPopover';
import { AttributesForm } from '@/components/AttributesForm';
import { columnsSchema } from '@/lib/blockSchemas/columns';
import { cardGroupSchema } from '@/lib/blockSchemas/cardGroup';
import { cn } from '@/lib/utils';

function clampCols(value: unknown): 1 | 2 | 3 | 4 {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n === 1 || n === 2 || n === 3 || n === 4) return n;
  return 2;
}

export const MdxColumns = Node.create({
  name: 'mdxColumns',
  group: 'block',
  content: 'mdxColumn+',
  defining: true,

  addAttributes() {
    return {
      cols: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-columns]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-columns': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxColumnsView);
  },
});

export const MdxColumn = Node.create({
  name: 'mdxColumn',
  group: 'mdxColumnItem',
  content: 'block+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-mdx-column]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-column': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxColumnView);
  },
});

export const MdxCardGroup = Node.create({
  name: 'mdxCardGroup',
  group: 'block',
  content: 'mdxCard+',
  defining: true,

  addAttributes() {
    return {
      cols: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-card-group]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-card-group': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxCardGroupView);
  },
});

interface GridProps {
  attrs: { cols?: number | null };
  selected: boolean;
  children: React.ReactNode;
}

function Grid({ attrs, selected, children }: GridProps) {
  const cols = clampCols(attrs.cols);
  return (
    <div
      data-component-part="columns"
      className={cn(
        'grid max-w-none gap-4 grid-cols-1 sm:grid-cols-[repeat(var(--cols),minmax(0,1fr))]',
        selected && 'rounded-lg ring-2 ring-primary/40',
      )}
      style={{ ['--cols' as string]: cols } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

function MdxColumnsView({
  node,
  selected,
  editor,
  getPos,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const [attrOpen, setAttrOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const appendColumn = () => {
    if (typeof getPos !== 'function' || !editor.isEditable) return;
    const start = getPos();
    if (start == null) return;
    const insertAt = start + node.nodeSize - 1;
    editor
      .chain()
      .focus()
      .insertContentAt(insertAt, {
        type: 'mdxColumn',
        content: [{ type: 'paragraph' }],
      })
      .run();
  };

  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <NodeViewWrapper
      data-mdx-columns=""
      className="group/columns relative my-4"
      ref={wrapperRef}
    >
      <Grid attrs={node.attrs as { cols?: number | null }} selected={selected}>
        <NodeViewContent />
      </Grid>
      {editor.isEditable ? (
        <div
          contentEditable={false}
          className="mt-2 flex items-center justify-end gap-1"
        >
          <button
            type="button"
            aria-label="Add column"
            onMouseDown={stopPm}
            onClick={(e) => {
              stopPm(e);
              appendColumn();
            }}
            className="flex h-7 items-center gap-1 rounded border border-dashed border-stone-300 px-2 text-xs text-stone-500 hover:border-stone-400 hover:text-stone-700 dark:border-white/15 dark:text-stone-400 dark:hover:border-white/30 dark:hover:text-stone-200"
          >
            <Plus className="size-3.5" />
            Add column
          </button>
          <button
            type="button"
            aria-label="Edit columns"
            onMouseDown={stopPm}
            onClick={(e) => {
              stopPm(e);
              setAttrOpen(true);
            }}
            className="flex size-7 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          >
            <EllipsisVertical className="size-4" />
          </button>
        </div>
      ) : null}
      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={wrapperRef.current}
        title={columnsSchema.title}
        titleIcon={columnsSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={columnsSchema}
          values={node.attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}

function MdxColumnView({ selected }: NodeViewProps) {
  return (
    <NodeViewWrapper
      data-mdx-column=""
      className={cn(
        'min-w-0 prose dark:prose-invert',
        selected && 'rounded-md ring-2 ring-primary/40',
      )}
    >
      <NodeViewContent />
    </NodeViewWrapper>
  );
}

function MdxCardGroupView({
  node,
  selected,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const [attrOpen, setAttrOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <NodeViewWrapper
      data-mdx-card-group=""
      className="group/card-group relative my-4"
      ref={wrapperRef}
    >
      <Grid attrs={node.attrs as { cols?: number | null }} selected={selected}>
        <NodeViewContent />
      </Grid>
      <div
        contentEditable={false}
        className="absolute right-0 top-0 z-10 flex items-center"
      >
        <button
          type="button"
          aria-label="Edit card group"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setAttrOpen(true);
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded text-stone-400 transition-all dark:text-stone-500',
            'opacity-0 group-hover/card-group:opacity-100 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200',
            attrOpen && 'opacity-100',
          )}
        >
          <EllipsisVertical className="size-4" />
        </button>
      </div>
      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={wrapperRef.current}
        title={cardGroupSchema.title}
        titleIcon={cardGroupSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={cardGroupSchema}
          values={node.attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}
