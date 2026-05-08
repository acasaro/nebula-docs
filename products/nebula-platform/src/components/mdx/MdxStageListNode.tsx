import { useRef, useState, type SyntheticEvent } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { StageList } from '@nebula-docs/components';
import { EllipsisVertical, Plus } from 'lucide-react';
import { AttributesPopover } from '@/components/AttributesPopover';
import { stageListSchema } from '@/lib/blockSchemas/stage-list';
import { cn } from '@/lib/utils';

export const MdxStageList = Node.create({
  name: 'mdxStageList',
  group: 'block',
  content: 'mdxStage+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-mdx-stage-list]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-stage-list': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxStageListView);
  },
});

function MdxStageListView({
  node,
  selected,
  deleteNode,
  editor,
  getPos,
}: NodeViewProps) {
  const [attrOpen, setAttrOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const stopPm = (e: SyntheticEvent) => {
    e.stopPropagation();
  };

  const addStage = (e: SyntheticEvent) => {
    stopPm(e);
    const pos = typeof getPos === 'function' ? getPos() : null;
    if (pos == null) return;
    const insertAt = pos + node.nodeSize - 1;
    editor
      .chain()
      .focus()
      .insertContentAt(insertAt, {
        type: 'mdxStage',
        attrs: { label: 'New stage', status: 'pending' },
      })
      .run();
  };

  return (
    <NodeViewWrapper
      data-mdx-stage-list=""
      className={cn(
        'group/stage-list relative my-4',
        selected && 'rounded-2xl ring-2 ring-primary/40',
      )}
      ref={wrapperRef}
    >
      <StageList className="my-0">
        <NodeViewContent />
      </StageList>

      <div
        contentEditable={false}
        className="absolute top-0 right-[-32px] z-10 flex flex-col gap-1"
      >
        <button
          type="button"
          aria-label="Edit stage list"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setAttrOpen(true);
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded text-muted-foreground transition-all',
            'opacity-0 group-hover/stage-list:opacity-100 hover:bg-accent hover:text-foreground',
            attrOpen && 'opacity-100',
          )}
        >
          <EllipsisVertical className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Add stage"
          onMouseDown={stopPm}
          onClick={addStage}
          className={cn(
            'flex size-6 items-center justify-center rounded text-muted-foreground transition-all',
            'opacity-0 group-hover/stage-list:opacity-100 hover:bg-accent hover:text-foreground',
          )}
        >
          <Plus className="size-4" />
        </button>
      </div>

      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={wrapperRef.current}
        title={stageListSchema.title}
        titleIcon={stageListSchema.headerIcon}
        onDelete={deleteNode}
      >
        <p className="px-3 py-2 text-xs text-muted-foreground">
          No configurable properties. Use the kebab menu on each stage to
          edit its attributes.
        </p>
      </AttributesPopover>
    </NodeViewWrapper>
  );
}
