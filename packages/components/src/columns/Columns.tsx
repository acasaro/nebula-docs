import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../utils/cn';

export type ColCount = 1 | 2 | 3 | 4;

export interface ColumnsProps {
  children?: ReactNode;
  cols?: ColCount | `${ColCount}`;
  className?: string;
}

const DEFAULT_COLS: ColCount = 2;

/**
 * Mintlify-style Columns. Lays children out as a CSS grid with `cols` columns
 * (1-4, default 2). Collapses to a single column on narrow viewports.
 */
export function Columns({ children, cols = DEFAULT_COLS, className }: ColumnsProps) {
  const numCols = Number(cols) || DEFAULT_COLS;
  return (
    <div
      className={cn(
        'prose dark:prose-invert grid max-w-none gap-4',
        'grid-cols-1 sm:grid-cols-[repeat(var(--cols),minmax(0,1fr))]',
        className,
      )}
      style={{ '--cols': numCols } as CSSProperties}
      data-component-part="columns"
    >
      {children}
    </div>
  );
}

/**
 * Mintlify-style Column wrapper. Mostly a semantic marker — the parent
 * `<Columns>` grid handles layout. Keeps prose styling locally if desired.
 */
export function Column({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn('min-w-0', className)}
      data-component-part="column"
    >
      {children}
    </div>
  );
}

/**
 * Mintlify uses `CardGroup` interchangeably with Columns when wrapping
 * `<Card>` children. Treat as an alias.
 */
export { Columns as CardGroup };
