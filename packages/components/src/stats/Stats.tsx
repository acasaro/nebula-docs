import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface StatsProps {
  children?: ReactNode;
  /** Number of columns. When omitted, the grid auto-fits to a minimum
   *  track width of 160px so stats flow responsively. */
  columns?: number;
  className?: string;
}

/**
 * Container for `Stat` children. Lays them out in a CSS grid — fixed
 * columns when `columns` is set, otherwise auto-fits to viewport width.
 */
export function Stats({ children, columns, className }: StatsProps) {
  const style: CSSProperties = columns
    ? { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }
    : { gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' };

  return (
    <div
      style={style}
      className={cn(
        'my-5 grid gap-4 rounded-2xl border border-stone-200 bg-stone-50 px-6 py-5',
        'dark:border-stone-800 dark:bg-stone-900/40',
        className,
      )}
      data-component-part="stats"
    >
      {children}
    </div>
  );
}
