import { useRef, useState, type SyntheticEvent } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import {
  Stage,
  STAGE_STATUSES,
  type StageStatus,
} from '@nebula-docs/components';
import { EllipsisVertical } from 'lucide-react';
import { AttributesPopover } from '@/components/AttributesPopover';
import { AttributesForm } from '@/components/AttributesForm';
import { stageSchema } from '@/lib/blockSchemas/stage';
import { cn } from '@/lib/utils';

const STATUS_SET: ReadonlySet<string> = new Set(STAGE_STATUSES);

function isStatus(value: unknown): value is StageStatus {
  return typeof value === 'string' && STATUS_SET.has(value);
}

const ATTRS = ['label', 'status', 'meta'] as const;

export const MdxStage = Node.create({
  name: 'mdxStage',
  group: 'block',
  atom: true,
  defining: true,

  addAttributes() {
    return Object.fromEntries(
      ATTRS.map((name) => [name, { default: null as unknown }]),
    );
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-stage]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-stage': '' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxStageView);
  },
});

function MdxStageView({
  node,
  selected,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const attrs = node.attrs as {
    label?: string | null;
    status?: string | null;
    meta?: string | null;
  };

  const status: StageStatus = isStatus(attrs.status) ? attrs.status : 'pending';
  const label = attrs.label ?? 'Stage';
  const meta = attrs.meta ?? undefined;

  const [attrOpen, setAttrOpen] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);

  const stopPm = (e: SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <NodeViewWrapper
      data-mdx-stage=""
      className={cn(
        'group/stage relative',
        selected && 'rounded-lg ring-2 ring-primary/40',
      )}
    >
      <div ref={stageRef}>
        <Stage
          label={label}
          status={status}
          meta={meta}
          className="my-0"
        />
      </div>

      <div contentEditable={false} className="absolute top-1/2 right-2 z-10 -translate-y-1/2">
        <button
          type="button"
          aria-label="Edit stage attributes"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setAttrOpen(true);
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded text-stone-400 transition-all dark:text-stone-500',
            'opacity-0 group-hover/stage:opacity-100 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200',
            attrOpen && 'opacity-100',
          )}
        >
          <EllipsisVertical className="size-4" />
        </button>
      </div>

      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={stageRef.current}
        title={stageSchema.title}
        titleIcon={stageSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={stageSchema}
          values={attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}
