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

export const MdxExpandable = Node.create({
  name: 'mdxExpandable',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      title: { default: null },
      defaultOpen: { default: null },
      openedText: { default: null },
      closedText: { default: null },
    };
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
  const [open, setOpen] = useState(attrs.defaultOpen ?? false);
  const [attrOpen, setAttrOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const summaryLabel = open
    ? `${attrs.openedText ?? 'Hide'} ${attrs.title ?? 'child attributes'}`
    : `${attrs.closedText ?? 'Show'} ${attrs.title ?? 'child attributes'}`;

  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <NodeViewWrapper
      data-mdx-expandable=""
      className={cn(
        'group/expandable relative my-3 rounded-xl border border-stone-200/70 dark:border-white/10',
        selected && 'ring-2 ring-primary/40',
      )}
    >
      <div ref={containerRef}>
        <div
          contentEditable={false}
          className={cn(
            'not-prose flex w-full cursor-pointer list-none items-center px-3.5 py-3 text-sm text-stone-600 hover:bg-stone-50/50 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-white/5 dark:hover:text-stone-200',
            !open && 'rounded-xl',
            open && 'rounded-t-xl',
          )}
        >
          <button
            type="button"
            aria-label={open ? 'Collapse' : 'Expand'}
            aria-expanded={open}
            onMouseDown={stopPm}
            onClick={(e) => {
              stopPm(e);
              setOpen((prev) => !prev);
            }}
            className="flex size-5 shrink-0 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          >
            <ChevronRight
              className={cn('size-3.5 transition-transform', open && 'rotate-90')}
            />
          </button>
          <p className="m-0 ml-3 leading-tight">{summaryLabel}</p>
          <button
            type="button"
            aria-label="Edit expandable"
            onMouseDown={stopPm}
            onClick={(e) => {
              stopPm(e);
              setAttrOpen(true);
            }}
            className={cn(
              'ml-auto flex size-6 items-center justify-center rounded text-stone-400 transition-all dark:text-stone-500',
              'opacity-0 group-hover/expandable:opacity-100 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200',
              attrOpen && 'opacity-100',
            )}
          >
            <EllipsisVertical className="size-4" />
          </button>
        </div>
        <div
          className={cn(
            'border-t border-stone-100 px-3.5 py-3 dark:border-white/10',
            !open && 'hidden',
          )}
        >
          <NodeViewContent />
        </div>
      </div>
      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={containerRef.current}
        title={expandableSchema.title}
        titleIcon={expandableSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={expandableSchema}
          values={node.attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}
