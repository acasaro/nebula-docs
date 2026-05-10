import { ActivityRow } from "@/components/dashboard/ActivityRow";
import { LoadMoreFooter } from "@/components/dashboard/LoadMoreFooter";
import { PreviewExpandedDetails } from "@/components/dashboard/PreviewExpandedDetails";
import type { Deployment, PreviewEntry } from "@/lib/dashboard";

interface PreviewsTableProps {
  entries: PreviewEntry[];
  deployment: Deployment;
  hasMore: boolean;
  onLoadMore: () => void;
  loadingMore: boolean;
}

export function PreviewsTable({
  entries,
  deployment,
  hasMore,
  onLoadMore,
  loadingMore,
}: PreviewsTableProps) {
  return (
    <div className='overflow-hidden rounded-xl border border-border/60 bg-card text-card-foreground'>
      <div className='flex items-center gap-4 border-b border-border/60 bg-muted/20 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
        <span className='w-56 shrink-0'>Update</span>
        <span className='w-60 shrink-0'>Branch</span>
        <span className='w-32 shrink-0'>Status</span>
        <span className='flex-1' aria-hidden />
        <span className='size-4 shrink-0' aria-hidden />
      </div>
      <div>
        {entries.map((entry) => (
          <ActivityRow
            key={entry.id}
            entry={entry}
            showBranch
            showChanges={false}
            expandedContent={
              <PreviewExpandedDetails entry={entry} deployment={deployment} />
            }
          />
        ))}
      </div>
      {hasMore ? (
        <LoadMoreFooter onLoadMore={onLoadMore} loading={loadingMore} />
      ) : null}
    </div>
  );
}
