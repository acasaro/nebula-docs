import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/**
 * Skeleton placeholder for the MDX editor surface shown while a file's
 * content is being fetched. Shape mimics typical MDX prose — page title,
 * a couple of paragraph blocks, a section heading, more paragraph lines —
 * so the layout doesn't visibly jump when the real editor mounts.
 *
 * Widths are mixed (varying rem values) for a more natural-looking
 * placeholder; alignment follows the editor's `mdx-prose mx-auto max-w-3xl
 * py-10 px-16` container.
 */
export function EditorSurfaceSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('flex h-full flex-1 flex-col overflow-auto bg-background', className)}
      aria-hidden="true"
    >
      <div className="mx-auto w-full max-w-3xl px-16 py-10">
        {/* Title */}
        <Skeleton className="mb-4 h-9 w-3/5" />
        {/* Lead paragraph */}
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-11/12" />
        <Skeleton className="mb-8 h-4 w-2/3" />

        {/* Section heading */}
        <Skeleton className="mb-3 h-6 w-2/5" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-10/12" />
        <Skeleton className="mb-2 h-4 w-11/12" />
        <Skeleton className="mb-8 h-4 w-3/4" />

        {/* Code-block-ish block */}
        <Skeleton className="mb-8 h-32 w-full rounded-md" />

        {/* Another section */}
        <Skeleton className="mb-3 h-6 w-1/3" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-2 h-4 w-9/12" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  );
}
