import { useRef, useState, type SyntheticEvent } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { Stats } from '@nebula-docs/components';
import { EllipsisVertical, Plus } from 'lucide-react';
import { AttributesPopover } from '@/components/AttributesPopover';
import { AttributesForm } from '@/components/AttributesForm';
import { statsSchema } from '@/lib/blockSchemas/stats';
import { cn } from '@/lib/utils';

const ATTRS = ['columns'] as const;

export const MdxStats = Node.create({
  name: 'mdxStats',
  group: 'block',
  content: 'mdxStat+',
  defining: true,

  addAttributes() {
    return Object.fromEntries(
      ATTRS.map((name) => [name, { default: null as unknown }]),
    );
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-stats]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-stats': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxStatsView);
  },
});

function MdxStatsView({
  node,
  selected,
  updateAttributes,
  deleteNode,
  editor,
  getPos,
}: NodeViewProps) {
  const attrs = node.attrs as { columns?: number | null };
  const [attrOpen, setAttrOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const stopPm = (e: SyntheticEvent) => {
    e.stopPropagation();
  };

  const addStat = (e: SyntheticEvent) => {
    stopPm(e);
    const pos = typeof getPos === 'function' ? getPos() : null;
    if (pos == null) return;
    const insertAt = pos + node.nodeSize - 1;
    editor
      .chain()
      .focus()
      .insertContentAt(insertAt, {
        type: 'mdxStat',
        attrs: { value: '0', label: 'New stat', color: 'blue' },
      })
      .run();
  };

  return (
    <NodeViewWrapper
      data-mdx-stats=""
      className={cn(
        'group/stats relative my-5',
        selected && 'rounded-2xl ring-2 ring-primary/40',
      )}
      ref={wrapperRef}
    >
      <Stats
        columns={attrs.columns ?? undefined}
        // Same `display: contents` chain as FeatureCardGroup — Tiptap's
        // NodeViewContent wrappers would otherwise consume the grid as
        // a single track and stack every stat into one column.
        className="my-0 [&_[data-node-view-content]]:contents [&_[data-node-view-content-react]]:contents [&_.react-renderer]:contents"
      >
        <NodeViewContent />
      </Stats>

      <div
        contentEditable={false}
        className="absolute top-0 right-[-32px] z-10 flex flex-col gap-1"
      >
        <button
          type="button"
          aria-label="Edit stats attributes"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setAttrOpen(true);
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded text-muted-foreground transition-all',
            'opacity-0 group-hover/stats:opacity-100 hover:bg-accent hover:text-foreground',
            attrOpen && 'opacity-100',
          )}
        >
          <EllipsisVertical className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Add stat"
          onMouseDown={stopPm}
          onClick={addStat}
          className={cn(
            'flex size-6 items-center justify-center rounded text-muted-foreground transition-all',
            'opacity-0 group-hover/stats:opacity-100 hover:bg-accent hover:text-foreground',
          )}
        >
          <Plus className="size-4" />
        </button>
      </div>

      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={wrapperRef.current}
        title={statsSchema.title}
        titleIcon={statsSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={statsSchema}
          values={attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}
