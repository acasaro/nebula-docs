import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Icon as McoeIcon } from '../icon';
import { cn } from '../utils/cn';

export const TOPIC_CARD_COLORS = [
  'purple',
  'blue',
  'teal',
  'green',
  'yellow',
  'orange',
  'red',
  'neutral',
] as const;
export type TopicCardColor = (typeof TOPIC_CARD_COLORS)[number];

export interface TopicCardProps {
  children?: ReactNode;
  /** Brand hue. Drives the icon tile bg and "View all" link color. */
  color?: TopicCardColor;
  /** Pre-rendered icon node, or a string passed through to the shared
   *  Icon component. */
  icon?: ReactNode;
  title?: string;
  description?: string;
  /** When set, renders a "View all →" link at the bottom in the brand
   *  hue. Whole card stays as a normal `<div>` — only the children
   *  TopicLinks are clickable. */
  viewAllHref?: string;
  /** Editor mode — render the View all element as a non-clickable
   *  `<span>` so previewing the card doesn't navigate. */
  inactive?: boolean;
  className?: string;
}

const ACCENT_VAR: Record<TopicCardColor, string> = {
  purple: 'var(--brand-purple-mid)',
  blue: 'var(--brand-blue-mid)',
  teal: 'var(--brand-teal-mid)',
  green: 'var(--brand-green-mid)',
  yellow: 'var(--brand-yellow-mid)',
  orange: 'var(--brand-orange-mid)',
  red: 'var(--brand-red-mid)',
  neutral: 'var(--brand-neutral-dark)',
};

const TILE_VAR: Record<TopicCardColor, string> = {
  purple: 'var(--brand-purple-lightest)',
  blue: 'var(--brand-blue-lightest)',
  teal: 'var(--brand-teal-lightest)',
  green: 'var(--brand-green-lightest)',
  yellow: 'var(--brand-yellow-lightest)',
  orange: 'var(--brand-orange-light)',
  red: 'var(--brand-red-light)',
  neutral: 'var(--brand-neutral-light)',
};

/**
 * Topic-hub card: an icon + title + description header with a list of
 * `TopicLink` children, plus an optional "View all" CTA. Distinct from
 * `FeatureCard` because the children are structural (links), not free
 * MDX content.
 */
export function TopicCard({
  children,
  color = 'blue',
  icon,
  title,
  description,
  viewAllHref,
  inactive = false,
  className,
}: TopicCardProps) {
  const resolvedColor = TOPIC_CARD_COLORS.includes(color) ? color : 'blue';
  const resolvedIcon =
    typeof icon === 'string' ? <McoeIcon icon={icon} size={22} /> : icon;

  const styleVars = {
    '--topic-accent': ACCENT_VAR[resolvedColor],
    '--topic-tile-bg': TILE_VAR[resolvedColor],
    '--topic-icon-fg': `color-mix(in srgb, ${ACCENT_VAR[resolvedColor]} 60%, black)`,
  } as CSSProperties;

  return (
    <div
      style={styleVars}
      className={cn(
        'group relative my-3 flex h-full flex-col overflow-hidden rounded-2xl',
        'border border-stone-950/10 bg-white p-6',
        'dark:border-white/10 dark:bg-stone-900/40',
        className,
      )}
      data-component-part="topic-card"
      data-color={resolvedColor}
    >
      <div className="flex items-start gap-3">
        {resolvedIcon ? (
          <div
            className="flex size-[45px] shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: 'var(--topic-tile-bg)',
              color: 'var(--topic-icon-fg)',
            }}
            data-component-part="topic-card-icon-tile"
          >
            {resolvedIcon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          {title ? (
            <h3
              style={{ margin: 0 }}
              className="text-base font-semibold text-stone-800 dark:text-white"
              data-component-part="topic-card-title"
            >
              {title}
            </h3>
          ) : null}
          {description ? (
            <p
              style={title ? { marginTop: 4 } : { margin: 0 }}
              className="text-sm text-muted-foreground"
              data-component-part="topic-card-description"
            >
              {description}
            </p>
          ) : null}
        </div>
      </div>
      <div
        style={{ marginTop: 16 }}
        className="flex flex-col"
        data-component-part="topic-card-links"
      >
        {children}
      </div>
      {viewAllHref ? (
        inactive ? (
          <span
            style={{ color: 'var(--brand-blue-mid)' }}
            className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold"
            data-component-part="topic-card-view-all"
          >
            View all
            <ArrowRight className="size-3.5" />
          </span>
        ) : (
          <a
            href={viewAllHref}
            style={{ color: 'var(--brand-blue-mid)' }}
            className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold no-underline hover:underline"
            data-component-part="topic-card-view-all"
          >
            View all
            <ArrowRight className="size-3.5" />
          </a>
        )
      ) : null}
    </div>
  );
}
