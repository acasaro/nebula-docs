import { ArrowUpRight } from "lucide-react";
import {
  formatFileCounts,
  type ActivityEntry,
  type Deployment,
} from "@/lib/dashboard";

interface LiveExpandedDetailsProps {
  entry: ActivityEntry;
  deployment: Deployment;
}

/**
 * Live-tab row expansion. Surfaces commit metadata plus a link to the commit
 * on GitHub. A richer diff view comes later.
 */
export function LiveExpandedDetails({
  entry,
  deployment: _deployment,
}: LiveExpandedDetailsProps) {
  void _deployment;

  return (
    <div className='flex flex-col gap-3 text-sm'>
      <div>
        <div className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
          Commit details
        </div>
        <div className='mt-1 flex flex-col gap-0.5 font-mono text-xs text-foreground'>
          <span>source {entry.commit.source}</span>
          <span>commit {entry.commit.shortSha}</span>
        </div>
      </div>

      <div className='text-foreground'>{entry.title}</div>
      {entry.subtitle ? (
        <div className='text-xs text-muted-foreground'>{entry.subtitle}</div>
      ) : null}
      <div className='text-xs text-muted-foreground'>
        {formatFileCounts(entry.fileCounts)}
      </div>

      <a
        href={entry.commit.htmlUrl}
        target='_blank'
        rel='noreferrer'
        className='inline-flex w-fit items-center gap-1 text-xs font-medium text-brand-text hover:underline'>
        View commit on GitHub
        <ArrowUpRight className='size-3.5' />
      </a>
    </div>
  );
}
