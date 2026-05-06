import { useRef, useState } from 'react';
import { ChevronRight, EllipsisVertical, Plus } from 'lucide-react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { Icon, type IconLibrary, type IconType } from '@nebula-docs/components';
import { AttributesPopover } from '@/components/AttributesPopover';
import { AttributesForm } from '@/components/AttributesForm';
import { accordionSchema } from '@/lib/blockSchemas/accordion';
import { cn } from '@/lib/utils';

const ACCORDION_ATTRS = [
  'title',
  'description',
  'defaultOpen',
  'icon',
  'iconLibrary',
  'iconType',
] as const;

export const MdxAccordion = Node.create({
  name: 'mdxAccordion',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return Object.fromEntries(
      ACCORDION_ATTRS.map((name) => [name, { default: null as unknown }]),
    );
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-accordion]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-accordion': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxAccordionView);
  },
});

export const MdxAccordionGroup = Node.create({
  name: 'mdxAccordionGroup',
  group: 'block',
  content: 'mdxAccordion+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-mdx-accordion-group]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-accordion-group': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxAccordionGroupView);
  },
});

function MdxAccordionGroupView({
  node,
  selected,
  editor,
  getPos,
}: NodeViewProps) {
  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();
  const appendAccordion = () => {
    if (typeof getPos !== 'function' || !editor.isEditable) return;
    const start = getPos();
    if (start == null) return;
    const insertAt = start + node.nodeSize - 1;
    editor
      .chain()
      .focus()
      .insertContentAt(insertAt, {
        type: 'mdxAccordion',
        attrs: { title: null },
        content: [{ type: 'paragraph' }],
      })
      .run();
  };
  return (
    <NodeViewWrapper
      data-mdx-accordion-group=""
      className={cn('group/accordion-group relative my-3')}
    >
      <div
        className={cn(
          'overflow-hidden rounded-xl border border-stone-200/70 dark:border-white/10',
          '[&>[data-mdx-accordion]]:rounded-none [&>[data-mdx-accordion]]:border-0 [&>[data-mdx-accordion]]:my-0',
          '[&>[data-mdx-accordion]+[data-mdx-accordion]]:border-t [&>[data-mdx-accordion]+[data-mdx-accordion]]:border-stone-200/70 dark:[&>[data-mdx-accordion]+[data-mdx-accordion]]:border-white/10',
          selected && 'ring-2 ring-primary/40',
        )}
      >
        <NodeViewContent />
      </div>
      {editor.isEditable ? (
        <div
          contentEditable={false}
          className="mt-2 flex justify-end"
        >
          <button
            type="button"
            aria-label="Add accordion"
            onMouseDown={stopPm}
            onClick={(e) => {
              stopPm(e);
              appendAccordion();
            }}
            className={cn(
              'flex h-7 items-center gap-1.5 rounded-md border border-dashed border-stone-300 bg-stone-50/40 px-2.5 text-xs text-stone-500',
              'hover:border-stone-400 hover:bg-stone-100 hover:text-stone-700',
              'dark:border-white/15 dark:bg-white/5 dark:text-stone-400 dark:hover:border-white/30 dark:hover:bg-white/10 dark:hover:text-stone-200',
              'opacity-0 transition-opacity group-hover/accordion-group:opacity-100',
            )}
          >
            <Plus className="size-3.5" />
            Add accordion
          </button>
        </div>
      ) : null}
    </NodeViewWrapper>
  );
}

function MdxAccordionView({
  node,
  selected,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const attrs = node.attrs as {
    title?: string | null;
    description?: string | null;
    defaultOpen?: boolean | null;
    icon?: string | null;
    iconLibrary?: IconLibrary | null;
    iconType?: IconType | null;
  };

  const [open, setOpen] = useState(attrs.defaultOpen ?? false);
  const [attrOpen, setAttrOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <NodeViewWrapper
      data-mdx-accordion=""
      className={cn(
        'group/accordion relative my-3 overflow-hidden rounded-2xl border border-stone-200/70 bg-white dark:border-white/10 dark:bg-stone-900/40',
        selected && 'ring-2 ring-primary/40',
      )}
    >
      <div ref={containerRef}>
        <div
          contentEditable={false}
          className="not-prose flex items-start gap-3 px-6 py-4 text-stone-700 dark:text-stone-200"
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
            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          >
            <ChevronRight
              className={cn('size-4 transition-transform', open && 'rotate-90')}
            />
          </button>
          {attrs.icon ? (
            <span className="mt-0.5 size-4 shrink-0">
              <Icon
                icon={attrs.icon}
                iconLibrary={attrs.iconLibrary ?? undefined}
                iconType={attrs.iconType ?? undefined}
                size={16}
              />
            </span>
          ) : null}
          <div className="min-w-0 flex-1">
            <input
              value={attrs.title ?? ''}
              placeholder="Accordion title"
              onMouseDown={stopPm}
              onClick={stopPm}
              onChange={(e) => updateAttributes({ title: e.target.value || null })}
              className="not-prose w-full border-0 bg-transparent p-0 text-sm font-semibold leading-tight outline-none placeholder:text-stone-400 dark:placeholder:text-stone-600"
            />
            {attrs.description ? (
              <p className="not-prose mt-0.5 truncate text-xs text-stone-500 dark:text-stone-400">
                {attrs.description}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            aria-label="Edit accordion attributes"
            onMouseDown={stopPm}
            onClick={(e) => {
              stopPm(e);
              setAttrOpen(true);
            }}
            className={cn(
              'mt-0.5 flex size-6 items-center justify-center rounded text-stone-400 transition-all dark:text-stone-500',
              'opacity-0 group-hover/accordion:opacity-100 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200',
              attrOpen && 'opacity-100',
            )}
          >
            <EllipsisVertical className="size-4" />
          </button>
        </div>
        <div
          className={cn(
            'border-t border-stone-100 px-6 py-3 dark:border-white/10',
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
        title={accordionSchema.title}
        titleIcon={accordionSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={accordionSchema}
          values={node.attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}
