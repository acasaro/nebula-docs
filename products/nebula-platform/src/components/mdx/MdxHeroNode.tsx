import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { EllipsisVertical, Layers } from 'lucide-react';
import { useRef, useState } from 'react';
import { Hero, type HeroVariant } from '@nebula-docs/components';
import { AttributesForm } from '@/components/AttributesForm';
import { AttributesPopover } from '@/components/AttributesPopover';
import { heroSchema } from '@/lib/blockSchemas/hero';
import { cn } from '@/lib/utils';

/**
 * Atomic block node for `<Hero>`. The node view renders the runtime
 * `Hero` component directly. Multi-slide heroes (`slides={[...]}` in
 * source) round-trip via the `slides` opaque-expression attribute — the
 * editor preview shows a single-slide projection from the top-level
 * fields, with a notice in the settings panel.
 */
export const MdxHero = Node.create({
  name: 'mdxHero',
  group: 'block',
  atom: true,
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      variant: { default: null },
      eyebrow: { default: null },
      title: { default: null },
      accent: { default: null },
      description: { default: null },
      background: { default: null },
      textColor: { default: null },
      accentColor: { default: null },
      secondaryTitle: { default: null },
      secondaryDescription: { default: null },
      sideImage: { default: null },
      sideImageAlt: { default: null },
      interval: { default: null },
      // Hand-authored multi-slide payload preserved as an opaque JSX
      // expression. The editor doesn't render this directly — it only
      // round-trips it through serialization.
      slides: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'section[data-mdx-hero]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'section',
      mergeAttributes(HTMLAttributes, { 'data-mdx-hero': '' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxHeroView);
  },
});

interface HeroAttrs {
  variant: HeroVariant | null;
  eyebrow: string | null;
  title: string | null;
  accent: string | null;
  description: string | null;
  background: string | null;
  textColor: string | null;
  accentColor: string | null;
  secondaryTitle: string | null;
  secondaryDescription: string | null;
  sideImage: string | null;
  sideImageAlt: string | null;
  interval: number | null;
  slides: unknown;
}

function MdxHeroView({
  node,
  selected,
  editor,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const attrs = node.attrs as HeroAttrs;
  const [attrOpen, setAttrOpen] = useState(false);
  const kebabRef = useRef<HTMLButtonElement>(null);

  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();
  const hasAuthoredSlides = attrs.slides != null;

  const isEmpty =
    !attrs.title &&
    !attrs.eyebrow &&
    !attrs.description &&
    !attrs.background &&
    !hasAuthoredSlides;

  return (
    <NodeViewWrapper
      data-mdx-hero=""
      className={cn(
        'group/hero relative my-4',
        selected && 'rounded-xl outline outline-2 outline-primary/60',
      )}
    >
      {isEmpty ? (
        <div className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-muted/20 px-6 py-10 text-sm text-muted-foreground">
          <Layers className="size-5" />
          <span>Hero is empty — fill in a title to preview.</span>
          {editor.isEditable ? (
            <button
              type="button"
              ref={kebabRef}
              onMouseDown={stopPm}
              onClick={(e) => {
                stopPm(e);
                setAttrOpen(true);
              }}
              className="text-xs font-medium text-primary underline-offset-2 hover:underline"
            >
              Configure hero
            </button>
          ) : null}
        </div>
      ) : (
        <Hero
          variant={attrs.variant ?? 'banner'}
          eyebrow={attrs.eyebrow ?? undefined}
          title={attrs.title ?? undefined}
          accent={attrs.accent ?? undefined}
          description={attrs.description ?? undefined}
          background={attrs.background ?? undefined}
          textColor={attrs.textColor ?? undefined}
          accentColor={attrs.accentColor ?? undefined}
          secondaryTitle={attrs.secondaryTitle ?? undefined}
          secondaryDescription={attrs.secondaryDescription ?? undefined}
          sideImage={attrs.sideImage ?? undefined}
          sideImageAlt={attrs.sideImageAlt ?? undefined}
        />
      )}

      {editor.isEditable ? (
        <div
          contentEditable={false}
          className={cn(
            'pointer-events-none absolute right-3 top-3 z-40 transition-opacity',
            attrOpen ? 'opacity-100' : 'opacity-0 group-hover/hero:opacity-100',
          )}
        >
          <button
            ref={kebabRef}
            type="button"
            aria-label="Hero options"
            onMouseDown={stopPm}
            onClick={(e) => {
              stopPm(e);
              setAttrOpen(true);
            }}
            className="pointer-events-auto flex size-7 items-center justify-center rounded-md bg-black/70 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/85"
          >
            <EllipsisVertical className="size-3.5" />
          </button>
        </div>
      ) : null}

      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={kebabRef.current}
        title={heroSchema.title}
        titleIcon={heroSchema.headerIcon}
        onDelete={deleteNode}
      >
        {hasAuthoredSlides ? (
          <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900 dark:border-amber-700/60 dark:bg-amber-900/20 dark:text-amber-100">
            This hero has authored <code>slides</code> in source. The fields below
            edit the single-slide preview only — multi-slide content is
            preserved on save but not editable here yet.
          </div>
        ) : null}
        <AttributesForm
          schema={heroSchema}
          values={node.attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}
