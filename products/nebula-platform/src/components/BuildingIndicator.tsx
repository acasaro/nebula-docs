import { ExternalLink, Loader2, X } from "lucide-react";
import { useBranchBuild } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

interface BuildingIndicatorProps {
  /** `<owner>/<repo>` — used by the underlying useBranchBuild hook to scope
   *  the Firestore subscription. */
  repoFullName: string | null;
  /** Branch we're editing on. */
  branch: string | null;
  /** User-initiated dismiss. The build keeps running in the background;
   *  this only hides the chip. */
  onDismiss?: () => void;
}

/**
 * Persistent chip that surfaces the deploy.yml workflow's progress for the
 * current branch's latest commit. Rendered when:
 *
 *   - useBranchBuild has a doc for this branch (something kicked off a build), AND
 *   - the build's status is `queued` or `in_progress`
 *
 * Goes away when the build reaches a terminal state — at which point the
 * PreviewButton becomes enabled (or the channel URL refreshes if it was
 * already enabled). The user gets continuous feedback without a competing
 * spinner on the PreviewButton itself.
 *
 * Sibling to PublishingIndicator. RepoBrowser renders one or the other,
 * with publishing taking precedence (publishing implies a build is running
 * anyway — they'd otherwise stack and confuse the user).
 */
export function BuildingIndicator({
  repoFullName,
  branch,
  onDismiss,
}: BuildingIndicatorProps) {
  const build = useBranchBuild({ repoFullName, branch });

  // Hide when nothing's in flight: no build doc yet, no branch, or the
  // last build has reached a terminal state. The PreviewButton + the
  // dashboard's Activity feed cover the "done" / "failed" states.
  if (!build || !branch) return null;
  const inFlight = build.status === "queued" || build.status === "in_progress";
  if (!inFlight) return null;

  const label = `Building preview for ${branch}`;
  // workflow_run html_url is the run page on github.com — the most useful
  // link here, since clicking the chip should answer "what's it doing?"
  const href = build.htmlUrl || null;

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-md border px-2.5 py-1 text-sm font-medium",
        "border-border/60 bg-muted/40 text-foreground",
      )}
      role='status'
      aria-live='polite'>
      <Loader2 className='size-4 animate-spin text-muted-foreground' />
      {href ? (
        <a
          href={href}
          target='_blank'
          rel='noreferrer'
          className='inline-flex items-center gap-1 underline-offset-2 hover:underline'
          title='View build run on GitHub'>
          {label}
          <ExternalLink className='size-3 opacity-70' />
        </a>
      ) : (
        <span>{label}</span>
      )}
      {onDismiss ? (
        <button
          type='button'
          onClick={onDismiss}
          aria-label='Dismiss build indicator'
          className='ml-1 rounded p-0.5 text-muted-foreground hover:text-foreground'
          title='Dismiss (build continues in the background)'>
          <X className='size-3.5' />
        </button>
      ) : null}
    </div>
  );
}
