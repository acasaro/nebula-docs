import { useRef, useState } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { Badge, type BadgeColor } from '@nebula-docs/components';
import { AttributesPopover } from '@/components/AttributesPopover';
import { AttributesForm } from '@/components/AttributesForm';
import { badgeSchema } from '@/lib/blockSchemas/badge';
import { cn } from '@/lib/utils';

export const MdxBadge = Node.create({
  name: 'mdxBadge',
  inline: true,
  group: 'inline',
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      label: { default: '' },
      color: { default: null },
      variant: { default: null },
      shape: { default: null },
      size: { default: null },
      href: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'span[data-mdx-badge]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-mdx-badge': '' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxBadgeView, { as: 'span' });
  },
});

function MdxBadgeView({
  node,
  selected,
  editor,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const attrs = node.attrs as {
    label?: string;
    color?: BadgeColor | null;
    variant?: 'solid' | 'outline' | null;
    shape?: 'rounded' | 'pill' | null;
    size?: 'xs' | 'sm' | 'md' | 'lg' | null;
    href?: string | null;
  };
  const [attrOpen, setAttrOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <NodeViewWrapper
      as="span"
      data-mdx-badge=""
      className={cn(
        'inline-flex align-baseline',
        selected && 'rounded ring-2 ring-primary/40',
      )}
    >
      <span ref={wrapperRef} className="inline-flex">
        <Badge
          color={attrs.color ?? 'gray'}
          variant={attrs.variant ?? 'solid'}
          shape={attrs.shape ?? 'rounded'}
          size={attrs.size ?? 'md'}
          href={attrs.href ?? undefined}
          onClick={
            editor.isEditable
              ? () => setAttrOpen((p) => !p)
              : undefined
          }
        >
          {attrs.label || 'Badge'}
        </Badge>
      </span>
      {editor.isEditable ? (
        <AttributesPopover
          open={attrOpen}
          onOpenChange={setAttrOpen}
          anchorEl={wrapperRef.current}
          title={badgeSchema.title}
          titleIcon={badgeSchema.headerIcon}
          onDelete={deleteNode}
        >
          <span onMouseDown={stopPm} onClick={stopPm}>
            <AttributesForm
              schema={badgeSchema}
              values={node.attrs}
              onChange={updateAttributes}
            />
          </span>
        </AttributesPopover>
      ) : null}
    </NodeViewWrapper>
  );
}
