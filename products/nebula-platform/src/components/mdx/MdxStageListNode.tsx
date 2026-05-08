import type { SyntheticEvent } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { StageList } from '@nebula-docs/components';
import { Plus } from 'lucide-react';
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
  editor,
  getPos,
}: NodeViewProps) {
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
    >
      <StageList className="my-0 [&_[data-node-view-content]]:contents [&_[data-node-view-content-react]]:contents [&_.react-renderer]:contents">
        <NodeViewContent />
      </StageList>

      <div
        contentEditable={false}
        className="absolute top-0 right-[-32px] z-10"
      >
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
    </NodeViewWrapper>
  );
}
