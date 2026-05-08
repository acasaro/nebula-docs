import type { CSSProperties, ReactNode } from 'react';
import { Icon as McoeIcon } from '../icon';
import { cn } from '../utils/cn';

export const SHEET_COLORS = [
  'purple',
  'blue',
  'teal',
  'green',
  'yellow',
  'orange',
  'red',
  'neutral',
] as const;
export type SheetColor = (typeof SHEET_COLORS)[number];

export interface SheetProps {
  children?: ReactNode;
  /** Brand hue. Drives the left accent bar, header label color, and the
   *  tinted background. Defaults to `blue`. */
  color?: SheetColor;
  /** Pre-rendered icon node, or a string passed through to the shared
   *  Icon component (consistent with Callout / Card). */
  icon?: ReactNode;
  /** Header label rendered next to the icon in the accent color. */
  label?: string;
  className?: string;
}

const ACCENT: Record<SheetColor, string> = {
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
 * Freeform labeled content wrapper. Left accent bar in the brand hue,
 * header with optional icon + label, free MDX children below. The
 * background is a low-alpha mix of the accent color so dark mode
 * naturally produces a "ghost" surface against the canvas without a
 * separate dark-mode token.
 */
export function Sheet({
  children,
  color = 'blue',
  icon,
  label,
  className,
}: SheetProps) {
  const resolvedIcon =
    typeof icon === 'string' ? <McoeIcon icon={icon} size={30} /> : icon;
  const hasHeader = !!resolvedIcon || !!label;

  return (
    <div
      style={{ '--sheet-accent': ACCENT[color] } as CSSProperties}
      className={cn(
        'my-4 overflow-hidden rounded-lg border-l-4 px-5 py-4',
        'border-l-[var(--sheet-accent)]',
        'bg-[color-mix(in_srgb,var(--sheet-accent)_8%,transparent)]',
        className,
      )}
      data-component-part="sheet"
      data-color={color}
    >
      {hasHeader ? (
        <div
          className="mb-2 flex items-center gap-2 text-[color:var(--sheet-accent)]"
          data-component-part="sheet-header"
        >
          {resolvedIcon ? (
            <span
              className="flex size-[30px] shrink-0 items-center justify-center"
              data-component-part="sheet-icon"
            >
              {resolvedIcon}
            </span>
          ) : null}
          {label ? (
            <span
              className="text-[15px] font-semibold"
              data-component-part="sheet-label"
            >
              {label}
            </span>
          ) : null}
        </div>
      ) : null}
      <div
        className={cn(
          'prose dark:prose-invert max-w-none text-sm leading-6',
          '[&_p]:my-0 [&_p+p]:mt-2 [&_ol]:my-0 [&_ul]:my-0',
        )}
        data-component-part="sheet-content"
      >
        {children}
      </div>
    </div>
  );
}
