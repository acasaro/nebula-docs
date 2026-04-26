import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { Card } from '@nebula/components';
import { cn } from '@/lib/utils';

const ATTRS = ['title', 'icon', 'img', 'href', 'cta', 'horizontal', 'arrow'] as const;

export const MdxCard = Node.create({
  name: 'mdxCard',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return Object.fromEntries(
      ATTRS.map((name) => [name, { default: null as unknown }]),
    );
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-card]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-card': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxCardView);
  },
});

function MdxCardView({ node, selected }: NodeViewProps) {
  const attrs = node.attrs as {
    title?: string | null;
    icon?: string | null;
    img?: string | null;
    href?: string | null;
    cta?: string | null;
    horizontal?: boolean | null;
    arrow?: boolean | null;
  };

  return (
    <NodeViewWrapper
      data-mdx-card=""
      className={cn(
        'my-2',
        selected && 'rounded-2xl ring-2 ring-primary/40',
      )}
    >
      <Card
        title={attrs.title ?? undefined}
        icon={attrs.icon ?? undefined}
        img={attrs.img ?? undefined}
        href={attrs.href ?? undefined}
        cta={attrs.cta ?? undefined}
        horizontal={attrs.horizontal ?? undefined}
        arrow={attrs.arrow ?? undefined}
      >
        <NodeViewContent />
      </Card>
    </NodeViewWrapper>
  );
}
