import { useRef, useState, type SyntheticEvent } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { TopicLink } from '@nebula-docs/components';
import { EllipsisVertical } from 'lucide-react';
import { AttributesPopover } from '@/components/AttributesPopover';
import { AttributesForm } from '@/components/AttributesForm';
import { topicLinkSchema } from '@/lib/blockSchemas/topic-link';
import { cn } from '@/lib/utils';

const ATTRS = ['label', 'href'] as const;

export const MdxTopicLink = Node.create({
  name: 'mdxTopicLink',
  group: 'block',
  atom: true,
  defining: true,

  addAttributes() {
    return Object.fromEntries(
      ATTRS.map((name) => [name, { default: null as unknown }]),
    );
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-topic-link]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-topic-link': '' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxTopicLinkView);
  },
});

function MdxTopicLinkView({
  node,
  selected,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const attrs = node.attrs as { label?: string | null; href?: string | null };

  const [attrOpen, setAttrOpen] = useState(false);
  const linkRef = useRef<HTMLDivElement>(null);

  const stopPm = (e: SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <NodeViewWrapper
      data-mdx-topic-link=""
      className={cn(
        'group/topic-link relative',
        selected && 'rounded ring-2 ring-primary/40',
      )}
    >
      <div ref={linkRef}>
        <TopicLink
          label={attrs.label ?? ''}
          // Don't pass href in editor — keeps the row non-navigable while
          // editing. Serializer writes it back out.
          className="my-0"
        />
      </div>

      <div
        contentEditable={false}
        className="absolute top-1/2 right-1 z-10 -translate-y-1/2"
      >
        <button
          type="button"
          aria-label="Edit topic link attributes"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setAttrOpen(true);
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded text-stone-400 transition-all dark:text-stone-500',
            'opacity-0 group-hover/topic-link:opacity-100 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200',
            attrOpen && 'opacity-100',
          )}
        >
          <EllipsisVertical className="size-4" />
        </button>
      </div>

      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={linkRef.current}
        title={topicLinkSchema.title}
        titleIcon={topicLinkSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={topicLinkSchema}
          values={attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}
