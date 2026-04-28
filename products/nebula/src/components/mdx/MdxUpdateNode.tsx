import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { Update } from '@nebula-docs/components';
import { cn } from '@/lib/utils';

export const MdxUpdate = Node.create({
  name: 'mdxUpdate',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      label: { default: '' },
      description: { default: null },
      tags: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-update]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-update': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxUpdateView);
  },
});

function MdxUpdateView({ node, selected }: NodeViewProps) {
  const label = (node.attrs.label as string | null) ?? '';
  const description = (node.attrs.description as string | null) ?? undefined;
  const rawTags = node.attrs.tags;
  const tags = Array.isArray(rawTags)
    ? rawTags.map(String)
    : typeof rawTags === 'string'
      ? rawTags.split(',').map((t) => t.trim()).filter(Boolean)
      : undefined;

  return (
    <NodeViewWrapper
      data-mdx-update=""
      className={cn(
        'my-2',
        selected && 'rounded-md ring-2 ring-primary/40',
      )}
    >
      <Update label={label} description={description} tags={tags}>
        <NodeViewContent />
      </Update>
    </NodeViewWrapper>
  );
}
