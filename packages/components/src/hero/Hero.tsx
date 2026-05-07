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
  /** Override foreground color for this slide. */
  textColor?: string;
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
  accentColor?: string;
  secondaryTitle?: string;
  secondaryDescription?: string;
  sideImage?: string;
  sideImageAlt?: string;
  /** Free-form children rendered beneath the slide content. */
  children?: ReactNode;
}

const VARIANT_PADDING: Record<HeroVariant, string> = {
  banner: 'py-16 md:py-24',
  compact: 'py-8 md:py-12',
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

  // The memo above guarantees `list.length >= 1`, so the `?? list[0]` is
  // a noUncheckedIndexedAccess-friendly assertion that this is defined.
  const slide = list[Math.min(index, list.length - 1)] ?? list[0]!;
  const showPagination = list.length > 1;

  return (
    <section
      data-fullbleed=""
      data-variant={variant}
      className={cn(
        'not-prose relative block overflow-hidden',
        // The pagination controls anchor to the section, so add bottom
        // breathing room when it's visible.
        showPagination && 'pb-12',
        className,
      )}
      style={style}
    >
      <SlideContent
        slide={slide}
        variant={variant}
        padded={padded}
        // Children only flow into the first slide of a rotating hero so
        // the rotation doesn't surprise an author who passed a one-off
        // child element.
        children={index === 0 ? children : null}
      />
      {showPagination ? (
        <Pagination
          count={list.length}
          index={index}
          onSelect={setIndex}
          onNext={next}
          onPrev={prev}
        />
      ) : null}
    </section>
  );
}

interface SlideContentProps {
  slide: HeroSlide;
  variant: HeroVariant;
  padded: boolean;
  children: ReactNode;
}

function SlideContent({ slide, variant, padded, children }: SlideContentProps) {
  const fgStyle: CSSProperties = {};
  if (slide.textColor) fgStyle.color = slide.textColor;

  if (variant === 'split') {
    return (
      <div
        className="relative"
        style={{ ...fgStyle, background: slide.background ?? undefined }}
      >
        <SplitSideImage slide={slide} />
        <div className="px-6 py-10 md:px-12 md:pt-16 md:pb-12">
          <div className="relative z-10 mx-auto max-w-5xl">
            {slide.eyebrow ? <Eyebrow>{slide.eyebrow}</Eyebrow> : null}
            {slide.title ? (
              <Title size="md" accent={slide.accent} accentColor={slide.accentColor}>
                {slide.title}
              </Title>
            ) : null}
            {slide.description ? (
              <Description size="sm">{slide.description}</Description>
            ) : null}
          </div>
        </div>
        <div className="bg-white px-6 py-10 dark:bg-stone-950 md:px-12 md:pt-10 md:pb-12">
          <div className="relative z-10 mx-auto max-w-5xl">
            {slide.secondaryTitle ? (
              <h2 className="m-0 max-w-xl text-xl font-semibold leading-tight tracking-tight text-stone-900 dark:text-stone-100">
                {slide.secondaryTitle}
              </h2>
            ) : null}
            {slide.secondaryDescription ? (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-stone-600 dark:text-stone-400">
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
      className={cn('relative', padded && VARIANT_PADDING[variant])}
      style={{ ...fgStyle, background: slide.background ?? undefined }}
    >
      <div
        className={cn(
          'relative z-10 mx-auto max-w-5xl px-6 md:px-12',
          variant === 'compact' && 'flex flex-col gap-2',
        )}
      >
        {slide.eyebrow ? <Eyebrow>{slide.eyebrow}</Eyebrow> : null}
        {slide.title ? (
          <Title
            size={variant === 'compact' ? 'sm' : 'lg'}
            accent={slide.accent}
            accentColor={slide.accentColor}
          >
            {slide.title}
          </Title>
        ) : null}
        {slide.description ? (
          <Description size={variant === 'compact' ? 'sm' : 'md'}>
            {slide.description}
          </Description>
        ) : null}
        {variant === 'banner' && slide.actions && slide.actions.length > 0 ? (
          <ActionRow actions={slide.actions} />
        ) : null}
        {children}
      </div>
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 mb-4 inline-flex items-center gap-2 rounded-full border border-current/15 bg-current/5 px-4 py-1.5 text-xs font-medium uppercase tracking-wider opacity-80">
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </p>
  );
}

function Title({
  children,
  size,
  accent,
  accentColor,
}: {
  children: ReactNode;
  size: 'sm' | 'md' | 'lg';
  accent?: string;
  accentColor?: string;
}) {
  const sizeClass =
    size === 'lg'
      ? 'text-4xl md:text-5xl lg:text-6xl'
      : size === 'md'
        ? 'text-2xl md:text-3xl lg:text-4xl'
        : 'text-xl md:text-2xl lg:text-3xl';
  return (
    <h1
      className={cn(
        'm-0 font-bold leading-[1.1] tracking-tight',
        sizeClass,
      )}
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
}: {
  children: ReactNode;
  size: 'sm' | 'md';
}) {
  return (
    <p
      className={cn(
        'mt-4 max-w-2xl leading-relaxed opacity-80',
        size === 'md' ? 'text-base md:text-lg' : 'text-sm md:text-base',
      )}
    >
      {children}
    </p>
  );
}

function ActionRow({ actions }: { actions: HeroAction[] }) {
  return (
    <div className="mt-8 flex flex-wrap items-center gap-3">
      {actions.map((a, i) => {
        const style = a.style ?? (i === 0 ? 'primary' : 'secondary');
        return (
          <a
            key={`${a.href}-${a.label}`}
            href={a.href}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg px-6 py-3 text-sm font-semibold no-underline transition-colors',
              style === 'primary'
                ? 'bg-stone-900 text-white hover:bg-stone-800 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-200'
                : 'border border-current/15 bg-current/5 text-current hover:bg-current/10',
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
  onSelect: (i: number) => void;
  onNext: () => void;
  onPrev: () => void;
}

function Pagination({ count, index, onSelect, onNext, onPrev }: PaginationProps) {
  return (
    <div className="absolute inset-x-0 bottom-4 z-30 mx-auto flex max-w-5xl items-center justify-between px-6 md:px-12">
      <div className="flex items-center gap-1.5" role="tablist">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Slide ${i + 1}`}
            onClick={() => onSelect(i)}
            className={cn(
              'h-1 rounded-full transition-all',
              i === index
                ? 'w-8 bg-current opacity-95'
                : 'w-5 bg-current opacity-30 hover:opacity-50',
            )}
          />
        ))}
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Previous slide"
          onClick={onPrev}
          className="flex size-8 items-center justify-center rounded-md text-current opacity-60 transition-opacity hover:opacity-100"
        >
          <ChevronLeft className="size-5" />
        </button>
        <button
          type="button"
          aria-label="Next slide"
          onClick={onNext}
          className="flex size-8 items-center justify-center rounded-md text-current opacity-60 transition-opacity hover:opacity-100"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
    </div>
  );
}
