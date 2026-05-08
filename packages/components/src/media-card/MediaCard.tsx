import type { CSSProperties } from 'react';
import { cn } from '../utils/cn';

export const MEDIA_CARD_CATEGORY_COLORS = [
  'purple',
  'blue',
  'teal',
  'green',
  'yellow',
  'orange',
  'red',
  'neutral',
] as const;
export type MediaCardCategoryColor = (typeof MEDIA_CARD_CATEGORY_COLORS)[number];

export interface MediaCardProps {
  /** Hero image URL — sits above the content, full-width. */
  image?: string;
  /** Alt text for the hero image (a11y). */
  imageAlt?: string;
  title?: string;
  description?: string;
  /** Whole-card link target. When set, the card renders as `<a>` and is
   *  clickable end-to-end. */
  href?: string;
  /** Optional pill text shown above the title. */
  category?: string;
  /** Pill color (brand hue). Defaults to `blue` when a category is set. */
  categoryColor?: MediaCardCategoryColor;
  className?: string;
}

const PILL_VAR: Record<MediaCardCategoryColor, string> = {
  purple: 'var(--brand-purple-mid)',
  blue: 'var(--brand-blue-mid)',
  teal: 'var(--brand-teal-mid)',
  green: 'var(--brand-green-mid)',
  yellow: 'var(--brand-yellow-mid)',
  orange: 'var(--brand-orange-mid)',
  red: 'var(--brand-red-mid)',
  neutral: 'var(--brand-neutral-dark)',
};

/**
 * Hero-image card for resource indexes. Image dominates the upper half;
 * pill-style category badge sits inline above the title; description
 * below. The whole card is clickable when `href` is set.
 */
export function MediaCard({
  image,
  imageAlt,
  title,
  description,
  href,
  category,
  categoryColor = 'blue',
  className,
}: MediaCardProps) {
  const resolvedColor = MEDIA_CARD_CATEGORY_COLORS.includes(categoryColor)
    ? categoryColor
    : 'blue';
  const isLink = !!href;

  const styleVars = {
    '--media-pill-bg': PILL_VAR[resolvedColor],
  } as CSSProperties;

  // Card needs a definite height so the image frame's `height: 75%` resolves
  // against something. `min-h-[300px]` is the floor; `h-full` lets the card
  // stretch to fill its grid row when laid out in a `<Columns>` block.
  const wrapperClass = cn(
    'group relative my-3 flex h-full min-h-[300px] flex-col overflow-hidden rounded-2xl',
    'border border-stone-950/10 bg-white',
    'dark:border-white/10 dark:bg-stone-900/40',
    isLink && 'cursor-pointer no-underline text-inherit transition-shadow hover:shadow-md',
    className,
  );

  const body = (
    <>
      {image ? (
        // Image occupies the top 75% of the card. Bottom corners stay square
        // where the image meets the body — only the top corners round, via
        // the card's `overflow-hidden rounded-2xl` clip.
        <div
          className="relative w-full shrink-0 overflow-hidden rounded-b-none"
          style={{ height: '75%' }}
          data-component-part="media-card-image-frame"
        >
          <img
            src={image}
            alt={imageAlt ?? title ?? ''}
            // `!m-0` defeats the prose typography margin above the image;
            // `block` prevents inline-image baseline whitespace below.
            style={{ margin: 0 }}
            className="block h-full w-full object-cover !m-0"
            data-component-part="media-card-image"
          />
        </div>
      ) : null}
      <div
        className="flex flex-1 flex-col px-5 pt-4 pb-3"
        data-component-part="media-card-body"
      >
        {category ? (
          <span
            style={{ backgroundColor: 'var(--media-pill-bg)', marginBottom: 15 }}
            className="self-start rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white"
            data-component-part="media-card-category"
          >
            {category}
          </span>
        ) : null}
        {title ? (
          <h3
            style={{ margin: 0 }}
            className="text-base font-semibold leading-snug text-stone-800 dark:text-white"
            data-component-part="media-card-title"
          >
            {title}
          </h3>
        ) : null}
        {description ? (
          <p
            // 3-line clamp with ellipsis. `overflow-hidden` is required for
            // -webkit-line-clamp to take effect; `min-h-0` lets the clamp
            // win against any flex parent that would otherwise stretch the
            // paragraph to its natural height.
            style={title ? { marginTop: 4 } : { margin: 0 }}
            className="line-clamp-3 text-sm leading-snug text-muted-foreground"
            data-component-part="media-card-description"
          >
            {description}
          </p>
        ) : null}
      </div>
    </>
  );

  if (isLink) {
    return (
      <a
        href={href}
        style={styleVars}
        className={wrapperClass}
        data-component-part="media-card"
      >
        {body}
      </a>
    );
  }

  return (
    <div
      style={styleVars}
      className={wrapperClass}
      data-component-part="media-card"
    >
      {body}
    </div>
  );
}
