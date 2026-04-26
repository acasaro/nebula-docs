import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { Callout, type CalloutVariant } from '@nebula/components';
import { cn } from '@/lib/utils';

const PRESET_VARIANTS: ReadonlyArray<CalloutVariant> = [
  'info',
  'check',
  'note',
  'tip',
  'warning',
  'danger',
  'custom',
];

function isCalloutVariant(value: unknown): value is CalloutVariant {
  return (
    typeof value === 'string' &&
    (PRESET_VARIANTS as readonly string[]).includes(value)
  );
}

export const MdxCallout = Node.create({
  name: 'mdxCallout',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: 'note' as CalloutVariant,
        parseHTML: (el: HTMLElement) => {
          const v = el.getAttribute('data-variant');
          return isCalloutVariant(v) ? v : 'note';
        },
        renderHTML: (attrs: { variant: CalloutVariant }) => ({
          'data-variant': attrs.variant,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-callout]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-callout': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxCalloutView);
  },
});

function MdxCalloutView({ node, selected }: NodeViewProps) {
  const variant = isCalloutVariant(node.attrs.variant)
    ? node.attrs.variant
    : 'note';

  return (
    <NodeViewWrapper
      data-mdx-callout=""
      className={cn(
        'my-4',
        selected && 'rounded-2xl ring-2 ring-primary/40',
      )}
    >
      <Callout variant={variant} className="my-0">
        <NodeViewContent />
      </Callout>
    </NodeViewWrapper>
  );
}
