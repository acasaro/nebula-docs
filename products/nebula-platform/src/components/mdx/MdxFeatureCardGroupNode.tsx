import { useRef, useState, type SyntheticEvent } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { FeatureCardGroup } from '@nebula-docs/components';
import { EllipsisVertical, Plus } from 'lucide-react';
import { AttributesPopover } from '@/components/AttributesPopover';
import { AttributesForm } from '@/components/AttributesForm';
import { featureCardGroupSchema } from '@/lib/blockSchemas/feature-card-group';
import { cn } from '@/lib/utils';

const ATTRS = ['minWidth', 'gap'] as const;

export const MdxFeatureCardGroup = Node.create({
  name: 'mdxFeatureCardGroup',
  group: 'block',
  // Only FeatureCard children — keeps the grid focused and gives us
  // direct grid items so equal-heights via `align-items: stretch` works
  // without intermediate Tiptap wrappers swallowing the height.
  content: 'mdxFeatureCard+',
  defining: true,

  addAttributes() {
    return Object.fromEntries(
      ATTRS.map((name) => [name, { default: null as unknown }]),
    );
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-feature-card-group]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-feature-card-group': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxFeatureCardGroupView);
  },
});

function MdxFeatureCardGroupView({
  node,
  selected,
  updateAttributes,
  deleteNode,
  editor,
  getPos,
}: NodeViewProps) {
  const attrs = node.attrs as {
    minWidth?: string | null;
    gap?: string | null;
  };

  const [attrOpen, setAttrOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const stopPm = (e: SyntheticEvent) => {
    e.stopPropagation();
  };

  const addCard = (e: SyntheticEvent) => {
    stopPm(e);
    const pos = typeof getPos === 'function' ? getPos() : null;
    if (pos == null) return;
    const insertAt = pos + node.nodeSize - 1;
    editor
      .chain()
      .focus()
      .insertContentAt(insertAt, {
        type: 'mdxFeatureCard',
        attrs: { color: 'blue', accent: 'top-bar', layout: 'vertical' },
        content: [{ type: 'paragraph' }],
      })
      .run();
  };

  return (
    <NodeViewWrapper
      data-mdx-feature-card-group=""
      className={cn(
        'group/feature-card-group relative my-4',
        selected && 'rounded-2xl ring-2 ring-primary/40',
      )}
      ref={wrapperRef}
    >
      <FeatureCardGroup
        minWidth={attrs.minWidth ?? undefined}
        gap={attrs.gap ?? undefined}
        // Tiptap interposes 3 wrappers between the grid and each
        // FeatureCard NodeViewWrapper: data-node-view-content (the
        // ProseMirror content host), data-node-view-content-react
        // (React renderer wrapper), and .react-renderer. Each one needs
        // `display: contents` so the FeatureCard NodeViewWrapper
        // becomes a real grid item — without this the whole content
        // host counts as one grid track and every card stacks into a
        // single column.
        className="my-0 [&_[data-node-view-content]]:contents [&_[data-node-view-content-react]]:contents [&_.react-renderer]:contents"
      >
        <NodeViewContent />
      </FeatureCardGroup>

      {/* Kebab + add-card stacked vertically and positioned OUTSIDE
          the grid's right edge — matches the convention BlockHandle
          uses for top-level blocks (the kebab lives in the gutter
          beyond the content, never inside it). */}
      <div
        contentEditable={false}
        className="absolute top-0 right-[-32px] z-10 flex flex-col gap-1"
      >
        <button
          type="button"
          aria-label="Edit feature card group attributes"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setAttrOpen(true);
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded text-muted-foreground transition-all',
            'opacity-0 group-hover/feature-card-group:opacity-100 hover:bg-accent hover:text-foreground',
            attrOpen && 'opacity-100',
          )}
        >
          <EllipsisVertical className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Add feature card"
          onMouseDown={stopPm}
          onClick={addCard}
          className={cn(
            'flex size-6 items-center justify-center rounded text-muted-foreground transition-all',
            'opacity-0 group-hover/feature-card-group:opacity-100 hover:bg-accent hover:text-foreground',
          )}
        >
          <Plus className="size-4" />
        </button>
      </div>

      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={wrapperRef.current}
        title={featureCardGroupSchema.title}
        titleIcon={featureCardGroupSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={featureCardGroupSchema}
          values={attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}
