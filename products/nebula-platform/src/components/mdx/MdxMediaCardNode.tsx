import { useRef, useState, type SyntheticEvent } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import {
  MediaCard,
  MEDIA_CARD_CATEGORY_COLORS,
  type MediaCardCategoryColor,
} from '@nebula-docs/components';
import { EllipsisVertical } from 'lucide-react';
import { AttributesPopover } from '@/components/AttributesPopover';
import { AttributesForm } from '@/components/AttributesForm';
import { mediaCardSchema } from '@/lib/blockSchemas/media-card';
import { cn } from '@/lib/utils';

const COLOR_SET: ReadonlySet<string> = new Set(MEDIA_CARD_CATEGORY_COLORS);

function isCategoryColor(value: unknown): value is MediaCardCategoryColor {
  return typeof value === 'string' && COLOR_SET.has(value);
}

const ATTRS = [
  'image',
  'imageAlt',
  'title',
  'description',
  'href',
  'category',
  'categoryColor',
] as const;

export const MdxMediaCard = Node.create({
  name: 'mdxMediaCard',
  group: 'block',
  atom: true,
  defining: true,

  addAttributes() {
    return Object.fromEntries(
      ATTRS.map((name) => [name, { default: null as unknown }]),
    );
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-media-card]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-media-card': '' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxMediaCardView);
  },
});

function MdxMediaCardView({
  node,
  selected,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const attrs = node.attrs as {
    image?: string | null;
    imageAlt?: string | null;
    title?: string | null;
    description?: string | null;
    href?: string | null;
    category?: string | null;
    categoryColor?: string | null;
  };

  const categoryColor: MediaCardCategoryColor = isCategoryColor(attrs.categoryColor)
    ? attrs.categoryColor
    : 'blue';

  const [attrOpen, setAttrOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const stopPm = (e: SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <NodeViewWrapper
      data-mdx-media-card=""
      className={cn(
        'group/media-card relative my-3 h-full',
        selected && 'rounded-2xl ring-2 ring-primary/40',
      )}
    >
      <div ref={cardRef}>
        <MediaCard
          image={attrs.image ?? undefined}
          imageAlt={attrs.imageAlt ?? undefined}
          title={attrs.title ?? undefined}
          description={attrs.description ?? undefined}
          // Don't pass href in editor — would make the entire card a link
          // and intercept text selection. Popover surfaces the URL;
          // serializer round-trips it.
          category={attrs.category ?? undefined}
          categoryColor={categoryColor}
          className="my-0"
        />
      </div>

      <div contentEditable={false} className="absolute top-3 right-3 z-10">
        <button
          type="button"
          aria-label="Edit media card attributes"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setAttrOpen(true);
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded text-stone-400 transition-all dark:text-stone-500',
            'opacity-0 group-hover/media-card:opacity-100 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200',
            attrOpen && 'opacity-100',
          )}
        >
          <EllipsisVertical className="size-4" />
        </button>
      </div>

      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={cardRef.current}
        title={mediaCardSchema.title}
        titleIcon={mediaCardSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={mediaCardSchema}
          values={attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}
