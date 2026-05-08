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

  const wrapperClass = cn(
    'group relative my-3 flex h-full flex-col overflow-hidden rounded-2xl',
    'border border-stone-950/10 bg-white',
    'dark:border-white/10 dark:bg-stone-900/40',
    isLink && 'cursor-pointer no-underline text-inherit transition-shadow hover:shadow-md',
    className,
  );

  const body = (
    <>
      {image ? (
        <div className="relative aspect-[16/9] w-full overflow-hidden">
          <img
            src={image}
            alt={imageAlt ?? title ?? ''}
            className="h-full w-full object-cover"
            data-component-part="media-card-image"
          />
        </div>
      ) : null}
      <div
        className="flex flex-1 flex-col p-5"
        data-component-part="media-card-body"
      >
        {category ? (
          <span
            style={{ backgroundColor: 'var(--media-pill-bg)', marginBottom: 8 }}
            className="self-start rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white"
            data-component-part="media-card-category"
          >
            {category}
          </span>
        ) : null}
        {title ? (
          <h3
            style={{ margin: 0 }}
            className="text-base font-semibold text-stone-800 dark:text-white"
            data-component-part="media-card-title"
          >
            {title}
          </h3>
        ) : null}
        {description ? (
          <p
            style={title ? { marginTop: 8 } : { margin: 0 }}
            className="text-sm text-muted-foreground"
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
