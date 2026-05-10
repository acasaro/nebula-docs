import { Check, ExternalLink, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchPullRequest } from "@/lib/content";
import { cn } from "@/lib/utils";

const POLL_INTERVAL_MS = 10_000;

interface PublishingIndicatorProps {
  installationId: number;
  owner: string;
  repo: string;
  prNumber: number;
  prUrl: string;
  /** Branch the PR was opened from. Used as a key so React resets state
   *  when a different branch starts publishing. */
  branch: string;
  /** Called once after the PR closes with `merged: true`. The parent
   *  uses this to switch to the default branch (the publishing branch
   *  is auto-deleted by GitHub) and clear the publishing state. */
  onMerged: () => void;
  /** Called if the PR closes without merging (rare — manual close, force-
   *  close, etc.). Parent clears the publishing state and shows an error. */
  onFailed: (reason: string) => void;
  /** User-initiated dismiss. Parent clears the publishing state without
   *  switching branches. The PR keeps publishing in the background. */
  onDismiss: () => void;
}

type Phase = "publishing" | "merged" | "failed";

/**
 * Persistent chip that surfaces the merge state of an in-flight Publish
 * action. Polls GitHub every 10s for the PR's state and transitions:
 *
 *   publishing  →  merged    (PR closed, merged: true)
 *               →  failed    (PR closed, merged: false)
 *
 * Polling is fine for the typical 1–2 minute auto-merge cycle. A
 * webhook-driven Firestore subscription would be lower latency but the
 * activity collection's shape doesn't make per-PR queries cheap. Revisit
 * if the polling traffic becomes a concern.
 */
export function PublishingIndicator({
  installationId,
  owner,
  repo,
  prNumber,
  prUrl,
  branch,
  onMerged,
  onFailed,
  onDismiss,
}: PublishingIndicatorProps) {
  const [phase, setPhase] = useState<Phase>("publishing");

  useEffect(() => {
    let cancelled = false;
    let mergedFiredAt: number | null = null;

    const tick = async () => {
      try {
        const pr = await fetchPullRequest(installationId, owner, repo, prNumber);
        if (cancelled) return;
        if (pr.state === "closed") {
          if (pr.merged) {
            // Show ✓ briefly, then notify parent so it can switch branches.
            setPhase("merged");
            if (mergedFiredAt === null) {
              mergedFiredAt = Date.now();
              setTimeout(() => {
                if (!cancelled) onMerged();
              }, 2200);
            }
          } else {
            setPhase("failed");
            onFailed("PR was closed without merging.");
          }
        }
      } catch (err) {
        // Don't fail the whole indicator on a single poll error — could
        // be a transient network blip. Log and keep polling.
        // eslint-disable-next-line no-console
        console.warn("[PublishingIndicator] poll error:", err);
      }
    };

    tick();
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [installationId, owner, repo, prNumber, onMerged, onFailed]);

  // Reset phase if the parent switches to a different publishing branch
  // (rare — would only happen if the user publishes one branch, then
  // creates a new branch + publishes that, all without the first merge
  // completing). Key on `branch` so this remount does the right thing.
  void branch;

  const tone =
    phase === "merged"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
      : phase === "failed"
        ? "border-destructive/40 bg-destructive/10 text-destructive"
        : "border-border/60 bg-muted/40 text-foreground";

  const Icon = phase === "merged" ? Check : phase === "failed" ? X : Loader2;
  const iconCls =
    phase === "publishing" ? "animate-spin text-muted-foreground" : "";

  const label =
    phase === "merged"
      ? "Published"
      : phase === "failed"
        ? "Publish failed"
        : `Publishing PR #${prNumber}`;

  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center gap-2 rounded-md border px-2.5 py-1 text-sm font-medium",
        tone,
      )}
      role='status'
      aria-live='polite'>
      <Icon className={cn("size-4", iconCls)} />
      <span>{label}</span>
      <a
        href={prUrl}
        target='_blank'
        rel='noreferrer'
        className='inline-flex items-center gap-0.5 text-xs underline-offset-2 hover:underline'
        title='View PR on GitHub'>
        #{prNumber}
        <ExternalLink className='size-3' />
      </a>
      {phase !== "merged" ? (
        <button
          type='button'
          onClick={onDismiss}
          aria-label='Dismiss publishing indicator'
          className='ml-1 rounded p-0.5 text-muted-foreground hover:text-foreground'
          title='Dismiss (publishing continues in the background)'>
          <X className='size-3.5' />
        </button>
      ) : null}
    </div>
  );
}
