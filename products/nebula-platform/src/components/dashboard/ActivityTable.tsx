import { ActivityRow } from "@/components/dashboard/ActivityRow";
import { LiveExpandedDetails } from "@/components/dashboard/LiveExpandedDetails";
import type { ActivityEntry, Deployment } from "@/lib/dashboard";

interface ActivityTableProps {
  entries: ActivityEntry[];
  deployment: Deployment;
}

export function ActivityTable({ entries, deployment }: ActivityTableProps) {
  return (
    <div className='overflow-hidden rounded-xl border border-border/60 bg-card text-card-foreground'>
      <div className='flex items-center gap-4 border-b border-border/60 bg-muted/20 px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground'>
        <span className='w-56 shrink-0'>Update</span>
        <span className='w-32 shrink-0'>Status</span>
        <span className='flex-1'>Changes</span>
        <span className='size-4 shrink-0' aria-hidden />
      </div>
      <div>
        {entries.map((entry) => (
          <ActivityRow
            key={entry.id}
            entry={entry}
            showBranch={false}
            expandedContent={
              <LiveExpandedDetails entry={entry} deployment={deployment} />
            }
          />
        ))}
      </div>
    </div>
  );
}
