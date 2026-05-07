import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { EllipsisVertical, Layers } from 'lucide-react';
import { useRef, useState } from 'react';
import { Hero, type HeroSlide, type HeroVariant } from '@nebula-docs/components';
import { HeroSettingsDrawer } from '@/components/HeroSettingsDrawer';
import { cn } from '@/lib/utils';

/**
 * Atomic block node for `<Hero>`. The node view renders the runtime
 * `Hero` component directly. All authoring lives on the per-slide level
 * — the node's `slides` attribute is always a non-empty array, even for
 * shorthand single-slide MDX (`<Hero title="..." />`). The serializer
 * emits the shorthand back out when there's exactly one slide.
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
      interval: { default: null },
      padded: { default: null },
      // HeroSlide[] — always non-empty. Tiptap stores arbitrary JSON-
      // serializable values here, which makes structured per-slide
      // editing trivial (no opaque expression escape hatch needed).
      slides: { default: [{}] as HeroSlide[] },
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
  interval: number | null;
  padded: boolean | null;
  slides: HeroSlide[];
}

function MdxHeroView({
  node,
  selected,
  editor,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const attrs = node.attrs as HeroAttrs;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const kebabRef = useRef<HTMLButtonElement>(null);

  const slides = attrs.slides && attrs.slides.length > 0 ? attrs.slides : [{}];
  const previewSlide = slides[0] ?? {};

  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();
  const isEmpty =
    !previewSlide.title &&
    !previewSlide.eyebrow &&
    !previewSlide.description &&
    !previewSlide.background &&
    slides.length === 1;

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
          <span>Hero is empty — add a title or open the settings drawer.</span>
          {editor.isEditable ? (
            <button
              type="button"
              ref={kebabRef}
              onMouseDown={stopPm}
              onClick={(e) => {
                stopPm(e);
                setDrawerOpen(true);
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
          interval={attrs.interval ?? undefined}
          padded={attrs.padded ?? undefined}
          slides={slides}
        />
      )}

      {editor.isEditable ? (
        <div
          contentEditable={false}
          className={cn(
            'pointer-events-none absolute right-3 top-3 z-40 transition-opacity',
            drawerOpen ? 'opacity-100' : 'opacity-0 group-hover/hero:opacity-100',
          )}
        >
          <button
            ref={kebabRef}
            type="button"
            aria-label="Hero options"
            onMouseDown={stopPm}
            onClick={(e) => {
              stopPm(e);
              setDrawerOpen(true);
            }}
            className="pointer-events-auto flex size-7 items-center justify-center rounded-md bg-black/70 text-white shadow-sm backdrop-blur-sm transition-colors hover:bg-black/85"
          >
            <EllipsisVertical className="size-3.5" />
          </button>
        </div>
      ) : null}

      <HeroSettingsDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        attrs={attrs}
        onChange={updateAttributes}
        onDelete={deleteNode}
      />
    </NodeViewWrapper>
  );
}
