import { useRef, useState, type SyntheticEvent } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import {
  TopicCard,
  Icon,
  TOPIC_CARD_COLORS,
  type TopicCardColor,
  type IconLibrary,
  type IconType,
} from '@nebula-docs/components';
import { EllipsisVertical, Plus } from 'lucide-react';
import { AttributesPopover } from '@/components/AttributesPopover';
import { AttributesForm } from '@/components/AttributesForm';
import { topicCardSchema } from '@/lib/blockSchemas/topic-card';
import { cn } from '@/lib/utils';

const COLOR_SET: ReadonlySet<string> = new Set(TOPIC_CARD_COLORS);

function isColor(value: unknown): value is TopicCardColor {
  return typeof value === 'string' && COLOR_SET.has(value);
}

const ATTRS = [
  'color',
  'icon',
  'iconLibrary',
  'iconType',
  'title',
  'description',
  'viewAllHref',
] as const;

export const MdxTopicCard = Node.create({
  name: 'mdxTopicCard',
  group: 'block',
  content: 'mdxTopicLink+',
  defining: true,

  addAttributes() {
    return Object.fromEntries(
      ATTRS.map((name) => [name, { default: null as unknown }]),
    );
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-topic-card]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-topic-card': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxTopicCardView);
  },
});

function MdxTopicCardView({
  node,
  selected,
  updateAttributes,
  deleteNode,
  editor,
  getPos,
}: NodeViewProps) {
  const attrs = node.attrs as {
    color?: string | null;
    icon?: string | null;
    iconLibrary?: IconLibrary | null;
    iconType?: IconType | null;
    title?: string | null;
    description?: string | null;
    viewAllHref?: string | null;
  };

  const color: TopicCardColor = isColor(attrs.color) ? attrs.color : 'blue';

  const [attrOpen, setAttrOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const stopPm = (e: SyntheticEvent) => {
    e.stopPropagation();
  };

  const addLink = (e: SyntheticEvent) => {
    stopPm(e);
    const pos = typeof getPos === 'function' ? getPos() : null;
    if (pos == null) return;
    const insertAt = pos + node.nodeSize - 1;
    editor
      .chain()
      .focus()
      .insertContentAt(insertAt, {
        type: 'mdxTopicLink',
        attrs: { label: 'New link', href: '' },
      })
      .run();
  };

  const iconElement = attrs.icon ? (
    <Icon
      icon={attrs.icon}
      iconLibrary={attrs.iconLibrary ?? undefined}
      iconType={attrs.iconType ?? undefined}
      size={22}
    />
  ) : undefined;

  return (
    <NodeViewWrapper
      data-mdx-topic-card=""
      className={cn(
        'group/topic-card relative my-3 h-full',
        selected && 'rounded-2xl ring-2 ring-primary/40',
      )}
    >
      <div ref={cardRef}>
        <TopicCard
          color={color}
          icon={iconElement}
          title={attrs.title ?? undefined}
          description={attrs.description ?? undefined}
          viewAllHref={attrs.viewAllHref ?? undefined}
          inactive
          className="my-0"
        >
          <NodeViewContent />
        </TopicCard>
      </div>

      <div
        contentEditable={false}
        className="absolute top-0 right-[-32px] z-10 flex flex-col gap-1"
      >
        <button
          type="button"
          aria-label="Edit topic card attributes"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setAttrOpen(true);
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded text-muted-foreground transition-all',
            'opacity-0 group-hover/topic-card:opacity-100 hover:bg-accent hover:text-foreground',
            attrOpen && 'opacity-100',
          )}
        >
          <EllipsisVertical className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Add topic link"
          onMouseDown={stopPm}
          onClick={addLink}
          className={cn(
            'flex size-6 items-center justify-center rounded text-muted-foreground transition-all',
            'opacity-0 group-hover/topic-card:opacity-100 hover:bg-accent hover:text-foreground',
          )}
        >
          <Plus className="size-4" />
        </button>
      </div>

      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={cardRef.current}
        title={topicCardSchema.title}
        titleIcon={topicCardSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={topicCardSchema}
          values={attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}
