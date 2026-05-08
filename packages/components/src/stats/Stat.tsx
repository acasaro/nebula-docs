import type { CSSProperties } from 'react';
import { cn } from '../utils/cn';

export const STAT_COLORS = [
  'purple',
  'blue',
  'teal',
  'green',
  'yellow',
  'orange',
  'red',
  'neutral',
] as const;
export type StatColor = (typeof STAT_COLORS)[number];

export interface StatProps {
  /** Big value text. String so it handles "40+", "100%", etc. without
   *  needing numeric coercion. */
  value?: string;
  /** Small descriptor below the value. */
  label?: string;
  /** Brand hue for the value text. Defaults to `blue`. */
  color?: StatColor;
  className?: string;
}

const VALUE_VAR: Record<StatColor, string> = {
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
 * One stat tile inside a `Stats` grid. Big coloured value on top, small
 * label beneath. Both are plain strings — no children — so the entire
 * stat is configurable via attrs alone.
 */
export function Stat({
  value = '',
  label = '',
  color = 'blue',
  className,
}: StatProps) {
  const resolved = STAT_COLORS.includes(color) ? color : 'blue';

  return (
    <div
      style={{ '--stat-value': VALUE_VAR[resolved] } as CSSProperties}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        className,
      )}
      data-component-part="stat"
      data-color={resolved}
    >
      <span
        // Inline style on the value because the `.mdx-prose` ancestor in
        // the editor would otherwise inject heading-style margins onto
        // any large text.
        style={{ color: 'var(--stat-value)', margin: 0 }}
        className="text-3xl font-semibold leading-none"
        data-component-part="stat-value"
      >
        {value}
      </span>
      <span
        style={{ marginTop: 8 }}
        className="text-sm text-muted-foreground"
        data-component-part="stat-label"
      >
        {label}
      </span>
    </div>
  );
}
