import { cn } from "@/lib/utils";

interface DeploymentThumbnailProps {
  siteName: string;
  className?: string;
}

/**
 * Faux browser-frame preview of the rendered docs site. CSS-only mock that
 * stays theme-aware. Kept as the fallback whenever a real screenshot isn't
 * available (and as the placeholder until a screenshot service is wired up).
 */
export function DeploymentThumbnail({ siteName, className }: DeploymentThumbnailProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card text-card-foreground shadow-sm",
        className,
      )}>
      <div className='flex items-center gap-1.5 border-b border-border/60 px-3 py-2'>
        <span className='size-2.5 rounded-full bg-muted-foreground/30' />
        <span className='size-2.5 rounded-full bg-muted-foreground/30' />
        <span className='size-2.5 rounded-full bg-muted-foreground/30' />
      </div>
      <div className='flex h-64 gap-3 p-3'>
        <div className='flex w-1/3 shrink-0 flex-col gap-1.5 rounded-md bg-muted/40 p-2'>
          <div className='text-[10px] font-semibold tracking-wide text-foreground'>
            {siteName.split(" ")[0] ?? "MCoE"}
          </div>
          <div className='mt-1 flex flex-col gap-1'>
            <span className='h-1.5 w-3/4 rounded bg-muted-foreground/30' />
            <span className='h-1.5 w-1/2 rounded bg-muted-foreground/20' />
            <span className='h-1.5 w-2/3 rounded bg-muted-foreground/20' />
            <span className='h-1.5 w-1/2 rounded bg-muted-foreground/20' />
          </div>
        </div>
        <div className='flex flex-1 flex-col gap-2'>
          <div className='text-[10px] font-medium text-muted-foreground'>Index</div>
          <div className='h-3 w-1/3 rounded bg-foreground/70' />
          <div className='mt-1 flex flex-col gap-1.5'>
            <span className='h-1.5 w-full rounded bg-muted-foreground/25' />
            <span className='h-1.5 w-11/12 rounded bg-muted-foreground/25' />
            <span className='h-1.5 w-3/4 rounded bg-muted-foreground/25' />
          </div>
          <div className='mt-2 text-[9px] uppercase tracking-wider text-muted-foreground/70'>
            Powered by Nebula
          </div>
        </div>
      </div>
    </div>
  );
}
