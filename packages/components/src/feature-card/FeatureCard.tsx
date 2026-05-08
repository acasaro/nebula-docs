import type { CSSProperties, ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';
import { Icon as McoeIcon } from '../icon';
import { cn } from '../utils/cn';

export const FEATURE_CARD_COLORS = [
  'purple',
  'blue',
  'teal',
  'green',
  'yellow',
  'orange',
  'red',
  'neutral',
] as const;
export type FeatureCardColor = (typeof FEATURE_CARD_COLORS)[number];

export type FeatureCardAccent = 'top-bar' | 'none';
export type FeatureCardLayout = 'vertical' | 'horizontal';

export interface FeatureCardProps {
  children?: ReactNode;
  /** Brand hue. Drives accent bar, icon tile, pill bg, and CTA color. */
  color?: FeatureCardColor;
  /** Whether to show the colored top accent bar. */
  accent?: FeatureCardAccent;
  /** Layout: vertical stacks icon above content; horizontal puts icon
   *  alongside (Quick-Access pattern). */
  layout?: FeatureCardLayout;
  /** Icon node or string (Material symbol shorthand). */
  icon?: ReactNode;
  /** Optional status pill text, e.g. "LIVE", "WEEKLY". */
  pill?: string;
  /** Title — string for tenant MDX, ReactNode so the editor can pass an
   *  inline-editable input that takes over the title slot. */
  title?: ReactNode;
  /** CTA label. When set, renders a "{linkText} →" line in the accent
   *  color and turns the whole card into a link if `linkUrl` is set. */
  linkText?: string;
  linkUrl?: string;
  className?: string;
}

const ACCENT_VAR: Record<FeatureCardColor, string> = {
  purple: 'var(--brand-purple-mid)',
  blue: 'var(--brand-blue-mid)',
  teal: 'var(--brand-teal-mid)',
  green: 'var(--brand-green-mid)',
  yellow: 'var(--brand-yellow-mid)',
  orange: 'var(--brand-orange-mid)',
  red: 'var(--brand-red-mid)',
  neutral: 'var(--brand-neutral-dark)',
};

const TILE_VAR: Record<FeatureCardColor, string> = {
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
 * Self-contained data card used on landing pages. One component covers
 * the four visual patterns the legacy site shipped as separate
 * components: top-bar with icon tile, horizontal Quick-Access tile,
 * top-bar text-only, and top-bar with status pill.
 */
export function FeatureCard({
  children,
  color = 'blue',
  accent = 'top-bar',
  layout = 'vertical',
  icon,
  pill,
  title,
  linkText,
  linkUrl,
  className,
}: FeatureCardProps) {
  const isHorizontal = layout === 'horizontal';
  const showAccent = accent === 'top-bar';
  const isLink = !!linkUrl;

  const resolvedIcon =
    typeof icon === 'string' ? <McoeIcon icon={icon} size={20} /> : icon;

  const styleVars = {
    '--feature-accent': ACCENT_VAR[color],
    '--feature-tile-bg': TILE_VAR[color],
    // Darker shade of the accent for icon glyphs sitting on the lightest
    // tile bg — `mid` doesn't carry enough contrast on the very pale tile
    // for some hues. Mixing 60% accent with black hits ~AA at the icon
    // size for every brand color without per-hue tokens.
    '--feature-icon-fg': `color-mix(in srgb, ${ACCENT_VAR[color]} 60%, black)`,
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
      {showAccent ? (
        <div
          aria-hidden
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{ background: 'var(--feature-accent)' }}
          data-component-part="feature-card-accent-bar"
        />
      ) : null}
      <div
        className={cn(
          'flex-1 p-6',
          showAccent && 'pt-7',
          isHorizontal ? 'flex items-center gap-4' : 'flex flex-col',
        )}
        data-component-part="feature-card-body"
      >
        {resolvedIcon ? (
          <div
            className="flex size-10 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: 'var(--feature-tile-bg)',
              color: 'var(--feature-icon-fg)',
            }}
            data-component-part="feature-card-icon-tile"
          >
            {resolvedIcon}
          </div>
        ) : null}
        <div
          className={cn(
            'flex min-w-0 flex-1 flex-col',
            !isHorizontal && resolvedIcon ? 'mt-3' : null,
          )}
        >
          {pill ? (
            <span
              className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white"
              style={{ backgroundColor: 'var(--feature-accent)' }}
              data-component-part="feature-card-pill"
            >
              {pill}
            </span>
          ) : null}
          {title ? (
            <h3
              className="m-0 text-base font-semibold text-stone-800 dark:text-white"
              data-component-part="feature-card-title"
            >
              {title}
            </h3>
          ) : null}
          {children ? (
            <div
              className={cn(
                'text-sm leading-6 text-stone-600 dark:text-stone-400',
                '[&_p]:my-0 [&_p+p]:mt-2',
                title ? 'mt-1' : null,
              )}
              data-component-part="feature-card-description"
            >
              {children}
            </div>
          ) : null}
          {linkText ? (
            <span
              className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium"
              style={{ color: 'var(--feature-accent)' }}
              data-component-part="feature-card-cta"
            >
              {linkText}
              <ArrowRight className="size-3.5" />
            </span>
          ) : null}
        </div>
      </div>
    </>
  );

  if (isLink) {
    return (
      <a
        href={linkUrl}
        style={styleVars}
        className={wrapperClass}
        data-component-part="feature-card"
        data-color={color}
      >
        {body}
      </a>
    );
  }

  return (
    <div
      style={styleVars}
      className={wrapperClass}
      data-component-part="feature-card"
      data-color={color}
    >
      {body}
    </div>
  );
}
