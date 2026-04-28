import { useRef, useState } from 'react';
import { ChevronRight, EllipsisVertical } from 'lucide-react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { AttributesPopover } from '@/components/AttributesPopover';
import { AttributesForm } from '@/components/AttributesForm';
import { expandableSchema } from '@/lib/blockSchemas/expandable';
import { cn } from '@/lib/utils';

const EXPANDABLE_ATTRS = [
  'title',
  'defaultOpen',
  'openedText',
  'closedText',
] as const;

export const MdxExpandable = Node.create({
  name: 'mdxExpandable',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return Object.fromEntries(
      EXPANDABLE_ATTRS.map((name) => [name, { default: null as unknown }]),
    );
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-expandable]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-expandable': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxExpandableView);
  },
});

function MdxExpandableView({
  node,
  selected,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const attrs = node.attrs as {
    title?: string | null;
    defaultOpen?: boolean | null;
    openedText?: string | null;
    closedText?: string | null;
  };

  const [attrOpen, setAttrOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const stopPm = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const closedText = attrs.closedText || 'Show';
  const summary = `${closedText} ${attrs.title || 'child attributes'}`;

  return (
    <NodeViewWrapper
      data-mdx-expandable=""
      className={cn(
        'group/expandable relative my-3 overflow-hidden rounded-xl border border-stone-200/70 dark:border-white/10',
        selected && 'ring-2 ring-primary/40',
      )}
    >
      <div
        ref={wrapperRef}
        className="flex items-center gap-2 border-b border-stone-100 px-3.5 py-3 text-sm text-stone-600 dark:border-white/5 dark:text-stone-300"
      >
        <ChevronRight
          aria-hidden="true"
          className="size-3.5 shrink-0 text-stone-400"
        />
        <span className="leading-tight">{summary}</span>
      </div>

      <div className="px-3.5 py-3 text-stone-700 dark:text-stone-300">
        <NodeViewContent />
      </div>

      <div contentEditable={false} className="absolute right-2 top-2 z-10">
        <button
          type="button"
          aria-label="Edit expandable attributes"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setAttrOpen(true);
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded text-stone-400 transition-all dark:text-stone-500',
            'opacity-0 group-hover/expandable:opacity-100 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200',
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
        title={expandableSchema.title}
        titleIcon={expandableSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={expandableSchema}
          values={attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}
