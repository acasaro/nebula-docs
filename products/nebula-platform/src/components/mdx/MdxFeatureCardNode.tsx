import { useRef, useState, type SyntheticEvent } from 'react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import {
  FeatureCard,
  FEATURE_CARD_COLORS,
  Icon,
  type FeatureCardAccent,
  type FeatureCardColor,
  type FeatureCardLayout,
  type IconLibrary,
  type IconType,
} from '@nebula-docs/components';
import { EllipsisVertical } from 'lucide-react';
import { AttributesPopover } from '@/components/AttributesPopover';
import { AttributesForm } from '@/components/AttributesForm';
import { featureCardSchema } from '@/lib/blockSchemas/feature-card';
import { cn } from '@/lib/utils';

const COLOR_SET: ReadonlySet<string> = new Set(FEATURE_CARD_COLORS);
const ACCENT_SET: ReadonlySet<string> = new Set(['top-bar', 'none']);
const LAYOUT_SET: ReadonlySet<string> = new Set(['vertical', 'horizontal']);

function isColor(value: unknown): value is FeatureCardColor {
  return typeof value === 'string' && COLOR_SET.has(value);
}
function isAccent(value: unknown): value is FeatureCardAccent {
  return typeof value === 'string' && ACCENT_SET.has(value);
}
function isLayout(value: unknown): value is FeatureCardLayout {
  return typeof value === 'string' && LAYOUT_SET.has(value);
}

const ATTRS = [
  'color',
  'accent',
  'layout',
  'icon',
  'iconLibrary',
  'iconType',
  'pill',
  'title',
  'linkText',
  'linkUrl',
] as const;

export const MdxFeatureCard = Node.create({
  name: 'mdxFeatureCard',
  group: 'block',
  content: 'block+',
  defining: true,

  addAttributes() {
    return Object.fromEntries(
      ATTRS.map((name) => [name, { default: null as unknown }]),
    );
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-feature-card]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-feature-card': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxFeatureCardView);
  },
});

function MdxFeatureCardView({
  node,
  selected,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const attrs = node.attrs as {
    color?: string | null;
    accent?: string | null;
    layout?: string | null;
    icon?: string | null;
    iconLibrary?: IconLibrary | null;
    iconType?: IconType | null;
    pill?: string | null;
    title?: string | null;
    linkText?: string | null;
    linkUrl?: string | null;
  };

  const color: FeatureCardColor = isColor(attrs.color) ? attrs.color : 'blue';
  const accent: FeatureCardAccent = isAccent(attrs.accent)
    ? attrs.accent
    : 'top-bar';
  const layout: FeatureCardLayout = isLayout(attrs.layout)
    ? attrs.layout
    : 'vertical';

  const iconElement = attrs.icon ? (
    <Icon
      icon={attrs.icon}
      iconLibrary={attrs.iconLibrary ?? undefined}
      iconType={attrs.iconType ?? undefined}
      size={20}
    />
  ) : undefined;

  const stopPm = (e: SyntheticEvent) => {
    e.stopPropagation();
  };

  // Inline-editable title — rendered as an unstyled `<input>` slotted into
  // FeatureCard's title slot. The visual styling matches `<h3>` so
  // unfocused the input reads as the rendered title; focus shows the
  // input affordance. Eventual inline rich-text toolbar will target this.
  const titleNode = (
    <input
      type="text"
      value={attrs.title ?? ''}
      placeholder="Feature title"
      onChange={(e) =>
        updateAttributes({ title: e.target.value || null })
      }
      onClick={stopPm}
      onMouseDown={stopPm}
      className={cn(
        'w-full bg-transparent p-0 outline-none',
        'text-base font-semibold text-stone-800 dark:text-white',
        'placeholder:text-stone-400 dark:placeholder:text-stone-600',
      )}
    />
  );

  const [attrOpen, setAttrOpen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  return (
    <NodeViewWrapper
      data-mdx-feature-card=""
      className={cn(
        'group/feature-card relative my-3 h-full',
        selected && 'rounded-2xl ring-2 ring-primary/40',
      )}
    >
      <div ref={cardRef}>
        <FeatureCard
          color={color}
          accent={accent}
          layout={layout}
          icon={iconElement}
          pill={attrs.pill ?? undefined}
          title={titleNode}
          linkText={attrs.linkText ?? undefined}
          // Don't pass linkUrl in editor view — would make the entire
          // card a link element and intercept text selection. The
          // popover surfaces the URL; serialization writes it back out.
          className="my-0"
        >
          <NodeViewContent />
        </FeatureCard>
      </div>

      {/* Inline kebab — top-right, hover-revealed. Required because the
          editor's BlockHandle only attaches to top-level blocks; nested
          blocks (FeatureCard inside Columns) would otherwise have no
          access to the attributes popover. */}
      <div contentEditable={false} className="absolute top-3 right-3 z-10">
        <button
          type="button"
          aria-label="Edit feature card attributes"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setAttrOpen(true);
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded text-stone-400 transition-all dark:text-stone-500',
            'opacity-0 group-hover/feature-card:opacity-100 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200',
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
        title={featureCardSchema.title}
        titleIcon={featureCardSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={featureCardSchema}
          values={attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}
