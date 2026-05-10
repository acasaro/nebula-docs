import { ArrowUpRight, Check, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeploymentLogList } from "@/components/dashboard/DeploymentLogList";
import { formatFileCounts, type Deployment, type PreviewEntry } from "@/lib/dashboard";

interface PreviewExpandedDetailsProps {
  entry: PreviewEntry;
  deployment: Deployment;
}

export function PreviewExpandedDetails({
  entry,
  deployment: _deployment,
}: PreviewExpandedDetailsProps) {
  void _deployment;
  const fileCountSummary = formatFileCounts(entry.fileCounts);

  return (
    <div className='grid gap-8 md:grid-cols-2'>
      <div className='flex flex-col gap-5 text-sm'>
        {/* Change summary — moved here from the row's "Changes" column so the
            preview row can stay compact while the expanded view carries the
            commit subject + body + file-count summary inline with the rest
            of the deploy details. */}
        <div className='flex flex-col gap-1'>
          <p className='text-sm font-medium leading-snug text-foreground'>
            {entry.title}
          </p>
          {entry.subtitle ? (
            <p className='text-sm text-muted-foreground'>{entry.subtitle}</p>
          ) : null}
          {fileCountSummary ? (
            <p className='text-xs text-muted-foreground'>{fileCountSummary}</p>
          ) : null}
        </div>

        <div>
          <div className='inline-flex items-center gap-2 font-medium text-foreground'>
            <Check className='size-4 text-emerald-500' />
            Update successful
          </div>
          <p className='mt-1 text-sm text-muted-foreground'>
            {entry.successMessage}
          </p>
        </div>

        <div className='flex flex-col gap-1'>
          <div className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
            Preview URL
          </div>
          <a
            href={entry.previewUrl}
            target='_blank'
            rel='noreferrer'
            className='inline-flex w-fit items-center gap-1 break-all text-foreground hover:text-brand-text'>
            {entry.previewUrl}
            <ArrowUpRight className='size-3.5 shrink-0' />
          </a>
        </div>

        <div className='flex flex-col gap-1'>
          <div className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
            Commit details
          </div>
          <div className='flex flex-col gap-0.5 font-mono text-xs text-foreground'>
            <span>source {entry.commit.source}</span>
            <span>commit {entry.commit.shortSha}</span>
          </div>
        </div>

        <div className='flex flex-col gap-2'>
          <div className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
            Files changed
          </div>
          <ul className='flex flex-col gap-1'>
            {entry.filesChanged.map((file) => (
              <li key={file.path}>
                <a
                  href={file.url}
                  target='_blank'
                  rel='noreferrer'
                  className='inline-flex items-center gap-1 font-mono text-xs text-foreground underline-offset-2 hover:text-brand-text hover:underline'>
                  {file.path}
                  <ArrowUpRight className='size-3 shrink-0' />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className='flex flex-col gap-4'>
        <div className='flex items-center justify-end gap-2'>
          <Button variant='outline' size='sm'>
            Redeploy
            <RefreshCw />
          </Button>
          <Button variant='secondary' size='sm' asChild>
            <a href={entry.previewUrl} target='_blank' rel='noreferrer'>
              Visit
              <ExternalLink />
            </a>
          </Button>
        </div>
        <div>
          <div className='text-xs font-medium uppercase tracking-wide text-muted-foreground'>
            Deployment log
          </div>
          <div className='mt-2'>
            <DeploymentLogList steps={entry.log} />
          </div>
        </div>
      </div>
    </div>
  );
}
