import { Play } from "lucide-react";
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
 * Two states only — enabled when a previewUrl exists, disabled otherwise.
 * The BuildingIndicator + PublishingIndicator carry the in-flight signal,
 * so this button doesn't need a spinner / pulsing dot of its own.
 *
 * Tooltip explains the disabled reason (loading, no build yet, last
 * build failed without a fallback URL). When enabled, the tooltip is
 * just "Open preview" — even mid-rebuild, the channel URL serves the
 * previously-deployed content, so it's safe to click.
 */
export function PreviewButton({ repoFullName, branch }: PreviewButtonProps) {
  const build = useBranchBuild({ repoFullName, branch });
  const { disabled, tooltip, onClick } = deriveState(build);

  return (
    <button
      type='button'
      title={tooltip}
      aria-label={tooltip}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md border transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        disabled
          ? "cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground/60"
          : "border-border bg-background text-foreground hover:bg-accent",
      )}>
      <Play className='size-4' />
    </button>
  );
}

function deriveState(
  build: BuildDoc | null | undefined,
): { disabled: boolean; tooltip: string; onClick?: () => void } {
  if (build === undefined) {
    return { disabled: true, tooltip: "Loading preview status…" };
  }
  if (build === null) {
    return { disabled: true, tooltip: "Save changes to create a preview" };
  }
  if (build.previewUrl) {
    const failed =
      build.status === "completed" &&
      build.conclusion !== null &&
      build.conclusion !== "success";
    return {
      disabled: false,
      tooltip: failed
        ? "Open preview (last build failed; showing previous version)"
        : "Open preview",
      onClick: () =>
        window.open(build.previewUrl!, "_blank", "noopener,noreferrer"),
    };
  }
  if (
    build.status === "completed" &&
    build.conclusion !== "success" &&
    build.conclusion !== null
  ) {
    return { disabled: true, tooltip: "Build failed — view logs in dashboard" };
  }
  return { disabled: true, tooltip: "Building preview…" };
}
