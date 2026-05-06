import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const SKELETON_ROWS: ReadonlyArray<{
  /** Indent in pixels — matches NavTree's cascading indent. */
  indent: number;
  /** Bar width in CSS units. Mixed widths give a more "natural" skeleton. */
  width: string;
}> = [
  { indent: 8, width: '7rem' },
  { indent: 30, width: '9rem' },
  { indent: 30, width: '7rem' },
  { indent: 30, width: '8rem' },
  { indent: 8, width: '6rem' },
  { indent: 30, width: '8rem' },
  { indent: 30, width: '9rem' },
  { indent: 8, width: '7rem' },
  { indent: 30, width: '9rem' },
];

/**
 * Skeleton placeholder for the navigation sidebar shown while the docs.json
 * + frontmatter cache are still loading. Matches the real NavTree's row
 * heights and indent so the layout doesn't jump when content arrives.
 */
export function NavTreeSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col gap-1 py-2 pr-2', className)}>
      <div className="flex items-center justify-between pl-2 pr-1 pt-1 pb-1 text-xs text-muted-foreground/70">
        <span>Navigation</span>
        <span
          aria-hidden="true"
          className="flex size-5 items-center justify-center text-muted-foreground/40"
        >
          <Plus className="size-3.5" />
        </span>
      </div>
      <div className="flex animate-pulse flex-col gap-0.5">
        {SKELETON_ROWS.map((row, i) => (
          <div
            key={i}
            className="flex h-8 items-center gap-2 pl-2"
            style={{ marginLeft: `${row.indent}px` }}
          >
            <span className="size-3.5 shrink-0 rounded-sm bg-foreground/10" />
            <span
              className="h-3 rounded bg-foreground/10"
              style={{ width: row.width }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
