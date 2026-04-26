import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { Frame } from '@nebula/components';
import { cn } from '@/lib/utils';

export const MdxFrame = Node.create({
  name: 'mdxFrame',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      caption: { default: null },
      title: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-frame]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-frame': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxFrameView);
  },
});

function MdxFrameView({ node, selected }: NodeViewProps) {
  const caption = (node.attrs.caption as string | null) ?? undefined;
  const title = (node.attrs.title as string | null) ?? undefined;

  return (
    <NodeViewWrapper
      data-mdx-frame=""
      className={cn(
        'my-4',
        selected && 'rounded-2xl ring-2 ring-primary/40',
      )}
    >
      <Frame caption={caption} title={title}>
        <NodeViewContent />
      </Frame>
    </NodeViewWrapper>
  );
}
