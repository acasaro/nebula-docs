import { Loader2, Play } from "lucide-react";
import { useBranchBuild, type BuildDoc } from "@/lib/dashboard";
import { cn } from "@/lib/utils";

interface PreviewButtonProps {
  /** `<owner>/<repo>` — used to scope the Firestore subscription. */
  repoFullName: string | null;
  /** Branch we're editing on. Caller is responsible for hiding the button
   *  when on the default branch (the live site is its own affordance). */
  branch: string | null;
}

/**
 * Toolbar button that opens the current branch's preview URL in a new tab.
 * Reflects the latest deployment state for the branch:
 *
 *   - **No build yet** → disabled. Tooltip: "Save changes to create a preview"
 *   - **First build in flight** → disabled, spinner. Tooltip: "Building preview…"
 *   - **Build successful, fresh URL** → enabled. Tooltip: "Open preview"
 *   - **Build in flight, prior URL exists** → enabled with pulsing dot.
 *     Tooltip notes the rebuild. Click opens the previous channel content.
 *   - **Last build failed, prior URL exists** → enabled with amber dot.
 *     Tooltip notes the failure. Click opens the previous channel content.
 *   - **Build failed and no prior URL** → disabled, red dot. Tooltip points
 *     the user to the dashboard for logs.
 *
 * Firebase Hosting Channels keep serving the previously-deployed content
 * while a re-deploy is in flight, so it's safe to surface the URL even
 * during a rebuild — the user sees the *previous* commit's preview, with
 * the dot signaling they're not looking at the latest.
 */
export function PreviewButton({ repoFullName, branch }: PreviewButtonProps) {
  const build = useBranchBuild({ repoFullName, branch });
  const state = deriveState(build);

  return (
    <button
      type='button'
      title={state.tooltip}
      aria-label={state.tooltip}
      disabled={state.disabled}
      onClick={state.onClick}
      className={cn(
        "relative inline-flex size-8 shrink-0 items-center justify-center rounded-md border transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        state.disabled
          ? "cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground/60"
          : "border-border bg-background text-foreground hover:bg-accent",
      )}>
      {state.spinning ? (
        <Loader2 className='size-4 animate-spin' />
      ) : (
        <Play className='size-4' />
      )}
      {state.dot ? (
        <span
          className={cn(
            "absolute -right-0.5 -top-0.5 size-2 rounded-full ring-2 ring-background",
            state.dot === "rebuilding" && "animate-pulse bg-blue-500",
            state.dot === "warning" && "bg-amber-500",
            state.dot === "error" && "bg-destructive",
          )}
          aria-hidden
        />
      ) : null}
    </button>
  );
}

interface VisibleState {
  disabled: boolean;
  spinning: boolean;
  dot: "rebuilding" | "warning" | "error" | null;
  tooltip: string;
  onClick?: () => void;
}

/**
 * Map a build doc (or its absence) to button visuals. Pure function so
 * it's easy to unit-test the matrix.
 *
 *   build === undefined  → loading (Firestore snapshot hasn't arrived)
 *   build === null       → no build doc found for this branch
 *   build.status         → 'queued' | 'in_progress' | 'completed' | …
 *   build.conclusion     → 'success' | 'failure' | 'cancelled' | …
 */
function deriveState(build: BuildDoc | null | undefined): VisibleState {
  if (build === undefined) {
    return {
      disabled: true,
      spinning: true,
      dot: null,
      tooltip: "Loading preview status…",
    };
  }
  if (build === null) {
    return {
      disabled: true,
      spinning: false,
      dot: null,
      tooltip: "Save changes to create a preview",
    };
  }

  const inProgress = build.status === "queued" || build.status === "in_progress";
  const isCompleted = build.status === "completed";
  const succeeded = isCompleted && build.conclusion === "success";
  const failed = isCompleted && build.conclusion !== null && build.conclusion !== "success";
  const hasUrl = Boolean(build.previewUrl);
  const openUrl = hasUrl
    ? () =>
        window.open(build.previewUrl!, "_blank", "noopener,noreferrer")
    : undefined;

  if (inProgress && !hasUrl) {
    return {
      disabled: true,
      spinning: true,
      dot: null,
      tooltip: "Building preview…",
    };
  }
  if (inProgress && hasUrl) {
    return {
      disabled: false,
      spinning: false,
      dot: "rebuilding",
      tooltip: "Open preview (rebuilding for latest changes)",
      onClick: openUrl,
    };
  }
  if (failed && hasUrl) {
    return {
      disabled: false,
      spinning: false,
      dot: "warning",
      tooltip: "Open preview (last build failed; showing previous version)",
      onClick: openUrl,
    };
  }
  if (failed && !hasUrl) {
    return {
      disabled: true,
      spinning: false,
      dot: "error",
      tooltip: "Build failed — view logs in dashboard",
    };
  }
  if (succeeded && hasUrl) {
    return {
      disabled: false,
      spinning: false,
      dot: null,
      tooltip: "Open preview",
      onClick: openUrl,
    };
  }

  // Build doc exists but doesn't fit any known shape (e.g. status is
  // 'completed' with conclusion === null mid-write). Treat as building
  // until the next snapshot resolves it.
  return {
    disabled: true,
    spinning: true,
    dot: null,
    tooltip: "Preview state pending…",
  };
}
