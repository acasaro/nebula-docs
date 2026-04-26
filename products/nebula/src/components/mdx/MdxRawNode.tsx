import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { MdxFragment } from './MdxRenderer';

export const MdxRaw = Node.create({
  name: 'mdxRaw',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      source: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-raw]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-mdx-raw': '' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxRawView);
  },
});

function MdxRawView({ node, selected }: NodeViewProps) {
  const source = (node.attrs.source as string) ?? '';
  return (
    <NodeViewWrapper
      data-mdx-raw=""
      className={selected ? 'rounded-md ring-2 ring-primary/40' : undefined}
    >
      <div contentEditable={false}>
        <MdxFragment source={source} />
      </div>
    </NodeViewWrapper>
  );
}
