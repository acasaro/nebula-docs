import { useRef, useState, type CSSProperties } from 'react';
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
import { cn } from '@/lib/utils';

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

  const stopPm = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const colsRaw = node.attrs.cols as string | number | null;
  const colsNum = colsRaw != null && colsRaw !== '' ? Number(colsRaw) : 2;
  const cols = Number.isFinite(colsNum)
    ? Math.max(1, Math.min(4, colsNum))
    : 2;

  const appendColumn = () => {
    if (typeof getPos !== 'function' || !editor.isEditable) return;
    const pos = getPos();
    if (pos == null) return;
    const insertAt = pos + node.nodeSize - 1;
    editor
      .chain()
      .focus()
      .insertContentAt(insertAt, {
        type: 'mdxColumn',
        content: [{ type: 'paragraph' }],
      })
      .setTextSelection(insertAt + 2)
      .run();
  };

  return (
    <NodeViewWrapper
      data-mdx-columns=""
      className={cn(
        'group/cols relative my-4 rounded-2xl border border-dashed border-stone-200/70 p-3 dark:border-white/10',
        selected && 'ring-2 ring-primary/40',
      )}
    >
      <div
        ref={wrapperRef}
        className="grid gap-3"
        style={
          {
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          } as CSSProperties
        }
      >
        <NodeViewContent />
      </div>

      {editor.isEditable ? (
        <div
          contentEditable={false}
          className="mt-3 flex justify-start"
        >
          <button
            type="button"
            onClick={appendColumn}
            className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          >
            <Plus className="size-4" />
            Add column
          </button>
        </div>
      ) : null}

      <div contentEditable={false} className="absolute right-2 top-2 z-10">
        <button
          type="button"
          aria-label="Edit columns attributes"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setAttrOpen(true);
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded text-stone-400 transition-all dark:text-stone-500',
            'opacity-0 group-hover/cols:opacity-100 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200',
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
        'min-w-0 rounded-md border border-stone-200/40 p-3 dark:border-white/5',
        selected && 'ring-2 ring-primary/40',
      )}
    >
      <NodeViewContent />
    </NodeViewWrapper>
  );
}
