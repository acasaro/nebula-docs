import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

export type HeroVariant = 'banner' | 'compact' | 'split';

export interface HeroAction {
  label: string;
  href: string;
  /** Visual treatment. Defaults to `primary` for the first action and
   *  `secondary` for the rest. */
  style?: 'primary' | 'secondary';
}

export interface HeroSlide {
  /** Small uppercase eyebrow line above the title (banner variant). */
  eyebrow?: string;
  /** Main heading. */
  title?: string;
  /** Optional accent fragment appended to the title in a highlight color. */
  accent?: string;
  /** Body copy beneath the title. */
  description?: string;
  /** CTA buttons. Banner variant only. */
  actions?: HeroAction[];
  /** CSS background — color, gradient, or `url(…)` image. */
  background?: string;
  /** Override foreground color for this slide. Drives the description and
   *  any other inheriting text. */
  textColor?: string;
  /** Color for the title (and, by association, the eyebrow chip — which
   *  pulls its background tint, border, and dot from this color). */
  titleColor?: string;
  /** Color for the title's accent fragment. */
  accentColor?: string;
  /** Split variant only — second-tier title. */
  secondaryTitle?: string;
  /** Split variant only — second-tier description. */
  secondaryDescription?: string;
  /** Split variant only — image overlapping both tiers on the right. */
  sideImage?: string;
  /** Alt text for `sideImage`. */
  sideImageAlt?: string;
}

export interface HeroProps {
  variant?: HeroVariant;
  /** When provided, drives a rotating hero (length > 1). Single-element
   *  arrays render as a static slide. */
  slides?: HeroSlide[];
  /** Auto-advance interval in milliseconds. Omit for manual-only nav. */
  interval?: number;
  /** When false, removes vertical padding inside the inner container. */
  padded?: boolean;
  className?: string;
  style?: CSSProperties;

  // Single-slide top-level props. Ignored when `slides` is provided — kept
  // for back-compat with the original Hero API and for one-off authoring
  // where wrapping a single slide in an array is awkward.
  eyebrow?: string;
  title?: string;
  accent?: string;
  description?: string;
  actions?: HeroAction[];
  background?: string;
  textColor?: string;
  titleColor?: string;
  accentColor?: string;
  secondaryTitle?: string;
  secondaryDescription?: string;
  sideImage?: string;
  sideImageAlt?: string;
  /** Free-form children rendered beneath the slide content. */
  children?: ReactNode;
}

// Padding-driven sizing. Hero height grows with content; the bg image
// (with `center / cover`) covers the resulting area. Vertical padding
// only — horizontal gutters live on the inner `max-w-5xl` container so
// content lines up with whatever sits in the page's layout container
// below the hero (which uses the same `max-w-64rem + px-6` model).
const VARIANT_PADDING: Record<HeroVariant, string> = {
  banner: 'py-12 md:py-20',
  compact: 'py-6 md:py-10',
  split: '', // split tiers carry their own padding
};

/**
 * Marketing hero block. Three layout variants — `banner` (full hero with
 * CTAs), `compact` (slim title + subtitle), `split` (two stacked tiers
 * with optional side image) — all driven by the same slide shape.
 *
 * Pass `slides=[...]` for a rotating hero with bar-segment pagination;
 * pass top-level slide fields for a static single-slide hero.
 */
export function Hero({
  variant = 'banner',
  slides,
  interval,
  padded = true,
  className,
  style,
  children,
  ...singleSlide
}: HeroProps) {
  const list = useMemo<HeroSlide[]>(() => {
    if (slides && slides.length > 0) return slides;
    return [singleSlide as HeroSlide];
    // The single-slide spread is only re-evaluated when its keys change;
    // we deliberately key the memo on `slides` so the rotation state below
    // resets when the author swaps the slide array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slides]);

  const [index, setIndex] = useState(0);

  // Wrap-around helpers. `list.length` is always >= 1 from the memo above.
  const next = () => setIndex((i) => (i + 1) % list.length);
  const prev = () => setIndex((i) => (i - 1 + list.length) % list.length);

  // Auto-advance. Skipped when there's only one slide or no interval.
  useEffect(() => {
    if (!interval || list.length < 2) return;
    const id = window.setInterval(next, interval);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interval, list.length]);

  // Clamp the index when the slide list shrinks beneath it.
  useEffect(() => {
    if (index >= list.length) setIndex(0);
  }, [index, list.length]);

  const showPagination = list.length > 1;
  const safeIndex = Math.min(index, list.length - 1);

  // Cross-slide scaffold for stable slot positions. Each slot in a
  // rotating deck reserves space for the *longest* equivalent content
  // anywhere in the list — even when the active slide's own version is
  // shorter or missing. The scaffold renders alongside the active
  // content via a per-slot grid stack so the slot's box always takes
  // the max height. Result: every slot lives at a fixed Y across
  // slides regardless of wrap differences. Single-slide heroes skip
  // the scaffold (nothing to compare against).
  const scaffold = useMemo<SlideScaffold | null>(() => {
    if (!showPagination) return null;
    const longest = (key: 'eyebrow' | 'title' | 'description'): string | undefined => {
      let best: string | undefined;
      for (const s of list) {
        const v = s[key];
        if (typeof v === 'string' && (best === undefined || v.length > best.length)) {
          best = v;
        }
      }
      return best;
    };
    // Title's natural wrap depends on title + accent combined, so pick
    // the slide whose title+accent string is longest.
    let titleScaffoldSlide: HeroSlide | undefined;
    let titleScaffoldLen = 0;
    for (const s of list) {
      const len = (s.title ?? '').length + (s.accent ? s.accent.length + 1 : 0);
      if (len > titleScaffoldLen) {
        titleScaffoldLen = len;
        titleScaffoldSlide = s;
      }
    }
    let mostActions: HeroAction[] | undefined;
    for (const s of list) {
      const a = s.actions ?? [];
      if (!mostActions || a.length > mostActions.length) mostActions = a;
    }
    return {
      eyebrow: longest('eyebrow'),
      title: longest('title'),
      titleAccent: titleScaffoldSlide?.accent,
      description: longest('description'),
      actions: mostActions && mostActions.length > 0 ? mostActions : undefined,
    };
  }, [list, showPagination]);

  return (
    <section
      data-fullbleed=""
      data-variant={variant}
      className={cn(
        'not-prose relative block overflow-hidden',
        className,
      )}
      style={style}
    >
      {/* All slides render into the same grid cell — the container
          sizes to the tallest, and only the active one is visible.
          Inactive slides keep their full layout (so wrap-induced
          height differences are absorbed by the cell), but are
          hidden from the visual tree and AT. Single-slide heroes
          collapse this to a normal block via `grid-rows-[auto]`. */}
      <div className='grid grid-cols-1 grid-rows-1'>
        {list.map((s, i) => {
          const isActive = i === safeIndex;
          return (
            <div
              key={i}
              aria-hidden={!isActive}
              // `h-full` is the explicit handoff so SlideContent's
              // `h-full` resolves — without it, the cell stretches via
              // grid auto-sizing but its child has no resolvable
              // parent height to inherit.
              className={cn(
                'col-start-1 row-start-1 h-full',
                !isActive && 'invisible pointer-events-none',
              )}
            >
              <SlideContent
                slide={s}
                variant={variant}
                padded={padded}
                scaffold={scaffold}
                // Children only flow into the first slide of a rotating hero
                // so the rotation doesn't surprise an author who passed a
                // one-off child element.
                children={i === 0 ? children : null}
              />
            </div>
          );
        })}
      </div>
      {showPagination ? (
        <Pagination
          count={list.length}
          index={safeIndex}
          // Active slide's titleColor drives pagination tint — guarantees
          // the controls are legible against whatever bg the author chose
          // for that slide. Falls back to textColor, then to inherited
          // currentColor if neither is set.
          tintColor={
            list[safeIndex]?.titleColor ?? list[safeIndex]?.textColor
          }
          onSelect={setIndex}
          onNext={next}
          onPrev={prev}
        />
      ) : null}
    </section>
  );
}

interface SlideScaffold {
  /** Longest eyebrow string across the deck. */
  eyebrow?: string;
  /** Longest title string across the deck. */
  title?: string;
  /** Accent fragment from the slide whose title+accent combo is longest. */
  titleAccent?: string;
  /** Longest description across the deck. */
  description?: string;
  /** Action set from the slide with the most actions. */
  actions?: HeroAction[];
}

/**
 * Wraps a slot in a one-cell grid stack alongside an invisible scaffold,
 * so the cell sizes to whichever is taller — `children` (the active
 * content) or `scaffold` (the longest equivalent across the deck).
 * Applied per slot so eyebrow / title / description / actions each pin
 * to a stable Y across slides regardless of which slide is showing.
 */
function SlotStack({
  children,
  scaffold,
}: {
  children: ReactNode;
  scaffold: ReactNode;
}) {
  if (!scaffold) return <>{children}</>;
  return (
    <div className='grid grid-cols-1 grid-rows-1'>
      <div className='col-start-1 row-start-1'>{children}</div>
      <div className='col-start-1 row-start-1 invisible' aria-hidden>
        {scaffold}
      </div>
    </div>
  );
}

interface SlideContentProps {
  slide: HeroSlide;
  variant: HeroVariant;
  padded: boolean;
  scaffold: SlideScaffold | null;
  children: ReactNode;
}

const HIDDEN: CSSProperties = { visibility: 'hidden' };

function SlideContent({ slide, variant, padded, scaffold, children }: SlideContentProps) {
  const fgStyle: CSSProperties = {};
  if (slide.textColor) fgStyle.color = slide.textColor;

  if (variant === 'split') {
    return (
      <div
        // `h-full` so this slide fills the grid cell — the cell sizes to
        // the tallest slide in the deck (see the grid-stack in `Hero`),
        // and without `h-full` shorter slides paint their bg only up to
        // their natural content height, leaving an empty strip at the
        // bottom of the hero when they're active.
        className='relative flex h-full flex-col'
        style={{ ...fgStyle, background: slide.background ?? undefined }}
      >
        <SplitSideImage slide={slide} />
        <div className='px-6 py-10 md:px-12 md:pt-16 md:pb-12'>
          <div className='relative z-10 mx-auto w-full max-w-5xl'>
            <SlotStack
              scaffold={
                scaffold?.eyebrow ? <Eyebrow>{scaffold.eyebrow}</Eyebrow> : null
              }
            >
              {slide.eyebrow ? (
                <Eyebrow tintColor={slide.titleColor}>{slide.eyebrow}</Eyebrow>
              ) : null}
            </SlotStack>
            {slide.title ? (
              <Title
                size='md'
                accent={slide.accent}
                accentColor={slide.accentColor}
                titleColor={slide.titleColor}
              >
                {slide.title}
              </Title>
            ) : null}
            <SlotStack
              scaffold={
                scaffold?.description ? (
                  <Description size='sm'>{scaffold.description}</Description>
                ) : null
              }
            >
              {slide.description ? (
                <Description size='sm'>{slide.description}</Description>
              ) : null}
            </SlotStack>
          </div>
        </div>
        <div className="bg-white px-6 py-10 md:px-12 md:pt-10 md:pb-12">
          <div className="relative z-10 mx-auto max-w-5xl">
            {slide.secondaryTitle ? (
              <h2 className="m-0 max-w-xl text-xl font-semibold leading-tight tracking-tight text-stone-900">
                {slide.secondaryTitle}
              </h2>
            ) : null}
            {slide.secondaryDescription ? (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-600">
                {slide.secondaryDescription}
              </p>
            ) : null}
            {children}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      // `h-full` so the slide's bg covers the full grid-cell height
      // (the cell sizes to the tallest slide in the deck). `flex-col`
      // top-aligns the content so each slot lives at the same Y across
      // all slides — combined with the visibility-hidden scaffolds for
      // missing slots, common slots never appear to "move" when the
      // user advances the deck.
      className={cn(
        'relative flex h-full flex-col',
        padded && VARIANT_PADDING[variant],
      )}
      style={{ ...fgStyle, background: slide.background ?? undefined }}
    >
      <div
        className={cn(
          'relative z-10 mx-auto w-full max-w-5xl px-6',
          variant === 'compact' && 'flex flex-col gap-2',
        )}
      >
        <SlotStack
          scaffold={
            scaffold?.eyebrow ? (
              <Eyebrow>{scaffold.eyebrow}</Eyebrow>
            ) : null
          }
        >
          {slide.eyebrow ? (
            <Eyebrow tintColor={slide.titleColor}>{slide.eyebrow}</Eyebrow>
          ) : null}
        </SlotStack>
        {slide.title ? (
          <Title
            size={variant === 'compact' ? 'sm' : 'lg'}
            accent={slide.accent}
            accentColor={slide.accentColor}
            titleColor={slide.titleColor}
          >
            {slide.title}
          </Title>
        ) : null}
        <SlotStack
          scaffold={
            scaffold?.description ? (
              <Description size={variant === 'compact' ? 'sm' : 'md'}>
                {scaffold.description}
              </Description>
            ) : null
          }
        >
          {slide.description ? (
            <Description size={variant === 'compact' ? 'sm' : 'md'}>
              {slide.description}
            </Description>
          ) : null}
        </SlotStack>
        {variant === 'banner' ? (
          <SlotStack
            scaffold={
              scaffold?.actions ? (
                <ActionRow actions={scaffold.actions} />
              ) : null
            }
          >
            {slide.actions && slide.actions.length > 0 ? (
              <ActionRow actions={slide.actions} />
            ) : null}
          </SlotStack>
        ) : null}
        {children}
      </div>
    </div>
  );
}

function Eyebrow({
  children,
  tintColor,
  style,
}: {
  children: ReactNode;
  /** When set, the chip's background, border, and dot pull their hue from
   *  this color instead of inheriting from the surrounding text color.
   *  Sized via `currentColor`-based opacity utilities so a single color
   *  drives every chip surface consistently. */
  tintColor?: string;
  /** Style override — used by the scaffold path to render an invisible
   *  but layout-occupying placeholder. */
  style?: CSSProperties;
}) {
  return (
    <p
      className='m-0 mb-4 inline-flex w-fit items-center gap-2 rounded-full border border-current/15 bg-current/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider opacity-80'
      // Default to `inherit` so the chip's bg/border/dot tint with the
      // slide's textColor instead of the prose-`p` color rule that
      // flips with the document theme. `tintColor` (set when the slide
      // has a titleColor) wins over the inherit default.
      style={{
        color: tintColor ?? 'inherit',
        ...(style ?? null),
      }}
    >
      <span className='size-1.5 rounded-full bg-current' aria-hidden='true' />
      {children}
    </p>
  );
}

function Title({
  children,
  size,
  accent,
  accentColor,
  titleColor,
}: {
  children: ReactNode;
  size: 'sm' | 'md' | 'lg';
  accent?: string;
  accentColor?: string;
  /** Override the title's text color. Inline so it wins over the slide's
   *  outer `textColor` (which still drives description + actions). */
  titleColor?: string;
}) {
  const sizeClass =
    size === 'lg'
      ? 'text-4xl md:text-5xl lg:text-6xl'
      : size === 'md'
        ? 'text-2xl md:text-3xl lg:text-4xl'
        : 'text-xl md:text-2xl lg:text-3xl';
  return (
    <h1
      className={cn('m-0 font-bold leading-[1.1] tracking-tight', sizeClass)}
      style={titleColor ? { color: titleColor } : undefined}
    >
      {children}
      {accent ? (
        <>
          {' '}
          <span style={accentColor ? { color: accentColor } : undefined}>
            {accent}
          </span>
        </>
      ) : null}
    </h1>
  );
}

function Description({
  children,
  size,
  style,
}: {
  children: ReactNode;
  size: 'sm' | 'md';
  style?: CSSProperties;
}) {
  return (
    <p
      className={cn(
        'mt-4 max-w-2xl leading-relaxed opacity-80',
        size === 'md' ? 'text-base md:text-lg' : 'text-sm md:text-base',
      )}
      // `color: inherit` forces the description to take the slide's
      // textColor regardless of any prose typography rule (the CLI's
      // `:where(.mdx-prose) p` sets a theme-driven color that would
      // otherwise repaint this paragraph when the document is in dark
      // mode). Inline beats `:where()` cleanly.
      style={{ color: 'inherit', ...style }}
    >
      {children}
    </p>
  );
}

function ActionRow({
  actions,
  hidden,
}: {
  actions: HeroAction[];
  /** Renders the row invisible but layout-occupying — used as the
   *  scaffold for slides without their own actions. */
  hidden?: boolean;
}) {
  return (
    <div
      className='mt-8 flex flex-wrap items-center gap-3'
      style={hidden ? HIDDEN : undefined}
      aria-hidden={hidden}
    >
      {actions.map((a, i) => {
        const style = a.style ?? (i === 0 ? 'primary' : 'secondary');
        // Inline color overrides any prose-link rule (e.g. Platform's
        // `:where(.mdx-prose) a { @apply text-brand-text }`) that would
        // otherwise repaint these buttons. The CSS-var-based fill stays
        // on Tailwind utilities so a tenant's `--primary` swap still
        // drives the bg + outline; the foreground is locked because
        // there's no clean `--primary-foreground` cascade through the
        // editor's prose layer.
        const textOverride: CSSProperties =
          style === 'primary' ? { color: '#fff' } : {};
        return (
          <a
            key={`${a.href}-${a.label}`}
            href={a.href}
            style={textOverride}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-6 py-3 text-sm font-semibold no-underline transition-colors',
              // Brand-primary filled vs. translucent-primary outlined.
              // Both pull from `--primary`, which the CLI + Platform both
              // map to the tenant's brand color, so the CTAs adopt the
              // same accent the rest of the site uses (links, focus rings,
              // etc.) instead of a hardcoded black.
              style === 'primary'
                ? 'bg-primary hover:bg-primary/90'
                : 'border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15',
            )}
          >
            {a.label}
          </a>
        );
      })}
    </div>
  );
}

function SplitSideImage({ slide }: { slide: HeroSlide }) {
  if (!slide.sideImage) return null;
  return (
    <div
      aria-hidden={!slide.sideImageAlt}
      className="pointer-events-none absolute inset-y-0 left-1/2 z-20 hidden w-full max-w-5xl -translate-x-1/2 md:block"
    >
      <img
        src={slide.sideImage}
        alt={slide.sideImageAlt ?? ''}
        // The image straddles both tiers on the right side, vertically
        // centered. Sizing is fixed so the layout doesn't reflow as the
        // image loads — tenants supplying a wildly different aspect ratio
        // can override via custom CSS targeting `[data-component-part]`.
        className="absolute right-0 top-1/2 h-[110%] max-h-[420px] w-auto max-w-[60%] -translate-y-1/2 object-contain"
        data-component-part="hero-side-image"
        draggable={false}
      />
    </div>
  );
}

interface PaginationProps {
  count: number;
  index: number;
  /** Locks the bars + chevrons to a specific color (typically the active
   *  slide's titleColor). Without this they'd inherit currentColor from
   *  the surrounding text color, which can drift with the document
   *  light/dark theme even when the slide bg doesn't. */
  tintColor?: string;
  onSelect: (i: number) => void;
  onNext: () => void;
  onPrev: () => void;
}

function Pagination({
  count,
  index,
  tintColor,
  onSelect,
  onNext,
  onPrev,
}: PaginationProps) {
  // Atomic NodeView host (the editor) can swallow clicks before they
  // reach these controls — stop propagation on mousedown so ProseMirror
  // doesn't claim the press for selection. Harmless in non-editor
  // contexts since the events bubble normally otherwise.
  const stopMouse = (e: React.SyntheticEvent) => e.stopPropagation();
  const tintStyle: CSSProperties | undefined = tintColor
    ? { color: tintColor }
    : undefined;
  return (
    <div
      className='pointer-events-none absolute inset-x-0 bottom-5 z-30 mx-auto flex max-w-5xl items-center justify-between px-6 md:px-12'
      style={tintStyle}
      onMouseDown={stopMouse}
    >
      <div className='pointer-events-auto flex items-center gap-1.5' role='tablist'>
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            type='button'
            role='tab'
            aria-selected={i === index}
            aria-label={`Slide ${i + 1}`}
            onMouseDown={stopMouse}
            onClick={(e) => {
              stopMouse(e);
              onSelect(i);
            }}
            className={cn(
              'h-1 rounded-full transition-all drop-shadow-sm',
              i === index
                ? 'w-8 bg-current opacity-95'
                : 'w-5 bg-current opacity-40 hover:opacity-70',
            )}
          />
        ))}
      </div>
      <div className='pointer-events-auto flex items-center gap-1'>
        <button
          type='button'
          aria-label='Previous slide'
          onMouseDown={stopMouse}
          onClick={(e) => {
            stopMouse(e);
            onPrev();
          }}
          className='flex size-8 items-center justify-center rounded-md text-current opacity-70 drop-shadow-sm transition-opacity hover:opacity-100'
        >
          <ChevronLeft className='size-5' />
        </button>
        <button
          type='button'
          aria-label='Next slide'
          onMouseDown={stopMouse}
          onClick={(e) => {
            stopMouse(e);
            onNext();
          }}
          className='flex size-8 items-center justify-center rounded-md text-current opacity-70 drop-shadow-sm transition-opacity hover:opacity-100'
        >
          <ChevronRight className='size-5' />
        </button>
      </div>
    </div>
  );
}
