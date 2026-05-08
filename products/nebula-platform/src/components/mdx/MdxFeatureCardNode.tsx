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
  'linkText',
  'linkUrl',
] as const;

/**
 * Inline-editable title slot. Modeling the title as a real ProseMirror node
 * (instead of an `<input>` synced to a `title` attr) lets the bubble menu
 * pick up text selections and apply marks like any other editable content.
 *
 * The `level` attribute (1-4) controls which HTML heading tag the slot
 * renders as. The bubble menu changes levels via `updateAttributes`, scoped
 * to this node so it can't bleed onto the description blocks below.
 *
 * On disk the title round-trips as flat attrs on the parent JSX:
 * `<FeatureCard title="..." titleLevel={N}>` (titleLevel omitted when it's
 * the default 3). The CLI's FeatureCard React component reads those attrs
 * directly, so the published site mirrors the editor's level choice.
 *
 * Marks inside the title (bold/italic/link) are POC-lossy on save — they
 * survive the editor session but are stripped when the title flattens back
 * to the `title="..."` attr. We can't put them in a `<FeatureCardTitle>`
 * JSX child because the Astro+React+MDX boundary pre-renders nested React
 * children to HTML strings before they reach a React parent component, so
 * a parent FeatureCard couldn't introspect them to find the title slot.
 */
export const FEATURE_CARD_TITLE_LEVELS = [1, 2, 3, 4] as const;
export type FeatureCardTitleLevel = (typeof FEATURE_CARD_TITLE_LEVELS)[number];

export const MdxFeatureCardTitle = Node.create({
  name: 'mdxFeatureCardTitle',
  content: 'inline*',
  defining: true,
  isolating: true,
  selectable: false,

  addAttributes() {
    return {
      level: {
        default: 3 as FeatureCardTitleLevel,
        parseHTML: (el) => {
          const tag = el.tagName.toLowerCase();
          const m = /^h([1-4])$/.exec(tag);
          return m ? Number(m[1]) : 3;
        },
        renderHTML: () => ({}),
      },
    };
  },

  parseHTML() {
    return [
      { tag: 'h1[data-mdx-feature-card-title]' },
      { tag: 'h2[data-mdx-feature-card-title]' },
      { tag: 'h3[data-mdx-feature-card-title]' },
      { tag: 'h4[data-mdx-feature-card-title]' },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    const level = (FEATURE_CARD_TITLE_LEVELS as readonly number[]).includes(
      node.attrs.level,
    )
      ? (node.attrs.level as FeatureCardTitleLevel)
      : 3;
    const sizeClass: Record<FeatureCardTitleLevel, string> = {
      1: 'text-2xl',
      2: 'text-xl',
      3: 'text-base',
      4: 'text-sm',
    };
    return [
      `h${level}`,
      mergeAttributes(HTMLAttributes, {
        'data-mdx-feature-card-title': '',
        style: 'margin: 0',
        class: `font-semibold text-stone-800 dark:text-white empty:before:content-[attr(data-placeholder)] empty:before:text-stone-400 dark:empty:before:text-stone-600 ${sizeClass[level]}`,
        'data-placeholder': 'Feature title',
      }),
      0,
    ];
  },
});

export const MdxFeatureCard = Node.create({
  name: 'mdxFeatureCard',
  group: 'block',
  // Title slot first, then any block content for the description body.
  content: 'mdxFeatureCardTitle block*',
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
        {/* `title` is undefined so FeatureCard skips its own h3; the
            mdxFeatureCardTitle sub-node renders an <h3> as the first
            child of NodeViewContent below, and CSS on the body wrapper
            in FeatureCard treats subsequent siblings as description
            content. */}
        <FeatureCard
          color={color}
          accent={accent}
          layout={layout}
          icon={iconElement}
          pill={attrs.pill ?? undefined}
          title={undefined}
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
