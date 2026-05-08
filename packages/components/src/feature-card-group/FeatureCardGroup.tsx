import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface FeatureCardGroupProps {
  children?: ReactNode;
  /** Minimum width for an auto-fit grid track. Cards flow into as many
   *  columns as the container can fit at this minimum, then wrap.
   *  Defaults to `260px` to match the legacy MCoE landing grid. */
  minWidth?: string;
  /** Gap between cards in any valid CSS length. Defaults to `1rem` (16px). */
  gap?: string;
  className?: string;
}

/**
 * Auto-fit grid wrapper for `FeatureCard`. Each direct child becomes a
 * grid item; the grid uses `repeat(auto-fit, minmax(minWidth, 1fr))` so
 * cards flow naturally on any viewport without a hard column count.
 *
 * Equal heights come for free from the grid's default
 * `align-items: stretch`, paired with `h-full` on the FeatureCard
 * wrapper. The NodeView intermediates that block height-propagation
 * inside `Columns` aren't a problem here because `FeatureCardGroup`
 * contains the FeatureCard NodeViewWrapper directly.
 */
export function FeatureCardGroup({
  children,
  minWidth = '260px',
  gap = '1rem',
  className,
}: FeatureCardGroupProps) {
  return (
    <div
      className={cn('my-4 grid', className)}
      style={
        {
          gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`,
          gap,
        } as CSSProperties
      }
      data-component-part="feature-card-group"
    >
      {children}
    </div>
  );
}
