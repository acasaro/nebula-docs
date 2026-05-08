import { useRef, useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { AttributesPopover } from '@/components/AttributesPopover';
import { AttributesForm } from '@/components/AttributesForm';
import { tooltipSchema } from '@/lib/blockSchemas/tooltip';
import { cn } from '@/lib/utils';

export const MdxTooltip = Node.create({
  name: 'mdxTooltip',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      text: { default: 'tooltip' },
      title: { default: '' },
      description: { default: '' },
      cta: { default: null },
      href: { default: null },
      side: { default: 'top' },
      align: { default: 'center' },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-mdx-tooltip]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-mdx-tooltip': '' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxTooltipView, { as: 'span' });
  },
});

function MdxTooltipView({
  node,
  selected,
  editor,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const attrs = node.attrs as {
    text?: string;
    title?: string;
    description?: string;
    cta?: string | null;
    href?: string | null;
    side?: 'top' | 'bottom' | 'left' | 'right';
    align?: 'start' | 'center' | 'end';
  };
  const [attrOpen, setAttrOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();

  const triggerLabel = attrs.text || 'tooltip';

  return (
    <NodeViewWrapper
      as="span"
      data-mdx-tooltip=""
      className={cn(
        'inline-flex align-baseline',
        selected && 'rounded ring-2 ring-primary/40',
      )}
    >
      <span ref={wrapperRef} className="inline-flex">
        <span
          role="button"
          tabIndex={0}
          aria-label={attrs.title || attrs.description || triggerLabel}
          onClick={
            editor.isEditable
              ? (e) => {
                  e.preventDefault();
                  setAttrOpen((p) => !p);
                }
              : undefined
          }
          className={cn(
            'cursor-help underline decoration-2 decoration-stone-400 decoration-dotted underline-offset-4 dark:decoration-stone-400',
            'rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          )}
          title={
            attrs.title && attrs.description
              ? `${attrs.title}: ${attrs.description}`
              : attrs.title || attrs.description || undefined
          }
        >
          {triggerLabel}
        </span>
      </span>
      {editor.isEditable ? (
        <AttributesPopover
          open={attrOpen}
          onOpenChange={setAttrOpen}
          anchorEl={wrapperRef.current}
          title={tooltipSchema.title}
          titleIcon={tooltipSchema.headerIcon}
          onDelete={deleteNode}
        >
          <span onMouseDown={stopPm} onClick={stopPm}>
            <AttributesForm
              schema={tooltipSchema}
              values={node.attrs}
              onChange={updateAttributes}
            />
          </span>
        </AttributesPopover>
      ) : null}
    </NodeViewWrapper>
  );
}
