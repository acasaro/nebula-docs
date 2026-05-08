import { useRef, useState, type SyntheticEvent } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { Stat, STAT_COLORS, type StatColor } from '@nebula-docs/components';
import { EllipsisVertical } from 'lucide-react';
import { AttributesPopover } from '@/components/AttributesPopover';
import { AttributesForm } from '@/components/AttributesForm';
import { statSchema } from '@/lib/blockSchemas/stat';
import { cn } from '@/lib/utils';

const COLOR_SET: ReadonlySet<string> = new Set(STAT_COLORS);

function isColor(value: unknown): value is StatColor {
  return typeof value === 'string' && COLOR_SET.has(value);
}

const ATTRS = ['value', 'label', 'color'] as const;

export const MdxStat = Node.create({
  name: 'mdxStat',
  group: 'block',
  atom: true,
  defining: true,

  addAttributes() {
    return Object.fromEntries(
      ATTRS.map((name) => [name, { default: null as unknown }]),
    );
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-stat]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-mdx-stat': '' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxStatView);
  },
});

function MdxStatView({
  node,
  selected,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const attrs = node.attrs as {
    value?: string | null;
    label?: string | null;
    color?: string | null;
  };

  const color: StatColor = isColor(attrs.color) ? attrs.color : 'blue';

  const [attrOpen, setAttrOpen] = useState(false);
  const statRef = useRef<HTMLDivElement>(null);

  const stopPm = (e: SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <NodeViewWrapper
      data-mdx-stat=""
      className={cn(
        'group/stat relative h-full',
        selected && 'rounded-lg ring-2 ring-primary/40',
      )}
    >
      <div ref={statRef}>
        <Stat
          value={attrs.value ?? ''}
          label={attrs.label ?? ''}
          color={color}
          className="my-0"
        />
      </div>

      <div
        contentEditable={false}
        className="absolute top-1 right-1 z-10"
      >
        <button
          type="button"
          aria-label="Edit stat attributes"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setAttrOpen(true);
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded text-stone-400 transition-all dark:text-stone-500',
            'opacity-0 group-hover/stat:opacity-100 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200',
            attrOpen && 'opacity-100',
          )}
        >
          <EllipsisVertical className="size-4" />
        </button>
      </div>

      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={statRef.current}
        title={statSchema.title}
        titleIcon={statSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={statSchema}
          values={attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}
