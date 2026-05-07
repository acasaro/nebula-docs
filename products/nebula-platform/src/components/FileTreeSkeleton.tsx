import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const SKELETON_ROWS: ReadonlyArray<{
  /** Indent in pixels — matches FileTreePanel's depth-based indent. */
  indent: number;
  /** Bar width in CSS units. Mixed widths give a more natural look. */
  width: string;
}> = [
  { indent: 0, width: '7rem' },
  { indent: 18, width: '8rem' },
  { indent: 18, width: '6.5rem' },
  { indent: 18, width: '9rem' },
  { indent: 0, width: '6rem' },
  { indent: 18, width: '8rem' },
  { indent: 36, width: '7.5rem' },
  { indent: 36, width: '9rem' },
  { indent: 18, width: '7rem' },
  { indent: 0, width: '5.5rem' },
  { indent: 18, width: '8rem' },
];

/**
 * Skeleton placeholder for the Files tab tree shown while `fetchRepoTree`
 * is in flight. Mirrors the row height and indent steps of the real
 * FileTreePanel so the layout doesn't shift when paths arrive.
 */
export function FileTreeSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex animate-pulse flex-col gap-1 px-3 py-2', className)}
      aria-hidden="true"
    >
      {SKELETON_ROWS.map((row, i) => (
        <div
          key={i}
          className="flex h-7 items-center gap-2"
          style={{ paddingLeft: `${row.indent}px` }}
        >
          <Skeleton className="size-3.5 shrink-0 rounded-sm" />
          <Skeleton className="h-3" style={{ width: row.width }} />
        </div>
      ))}
    </div>
  );
}
