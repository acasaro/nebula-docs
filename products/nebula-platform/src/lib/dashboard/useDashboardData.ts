import { useCallback, useEffect, useMemo, useState } from "react";
import {
  clearTokenCache,
} from "@/lib/githubToken";
import {
  getCommitDetails,
  listBranches,
  listRecentCommits,
  type CommitAuthor,
  type CommitDetails,
  type CommitSummary,
} from "@/lib/content";
import { useGitSettings } from "@/lib/gitSettings";
import { dashboardMockData } from "./mockData";
import { subscribeBuilds, type BuildDoc } from "./firestore";
import type {
  Actor,
  ActivityEntry,
  DashboardData,
  DeploymentLogStep,
  EntryStatus,
  FileChange,
  FileChangeCount,
  PreviewEntry,
} from "./types";

export type DashboardDataState =
  | { status: "loading" }
  | { status: "no-repo" }
  | { status: "error"; error: string; refresh: () => void }
  | {
      status: "ready";
      data: DashboardData;
      refresh: () => void;
      hasMoreActivity: boolean;
      hasMorePreviews: boolean;
      loadMoreActivity: () => void;
      loadMorePreviews: () => void;
      loadingMore: boolean;
    };

/** Activity + previews paginate by this many entries per "Load more" click. */
const PAGE_SIZE = 5;
const SITE_NAME = "MCoE Documentation";
const MOCK_DOMAIN = "mcoe-docs.nebula.app";

function commitAuthorToActor(author: CommitAuthor): Actor {
  if (author.type === "Bot") {
    const name =
      author.login ? `${author.login.replace(/\[bot\]$/, "")}[bot]` : "bot";
    return {
      kind: "bot",
      name,
      shortName: name.replace(/\[bot\]$/, ""),
    };
  }
  const name =
    author.name?.trim() ||
    author.login ||
    author.email?.split("@")[0] ||
    "Unknown";
  const shortName = name;
  return {
    kind: "human",
    name,
    shortName,
    avatarUrl: author.avatarUrl ?? undefined,
  };
}

function splitMessage(message: string): { title: string; subtitle?: string } {
  const lines = message.split(/\r?\n/);
  const title = (lines[0] ?? message).trim();
  const subtitle = lines
    .slice(1)
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  return subtitle ? { title, subtitle } : { title };
}

const STATUS_TO_KIND: Record<string, FileChangeCount["kind"]> = {
  added: "added",
  removed: "removed",
  modified: "edited",
  renamed: "edited",
  changed: "edited",
  copied: "edited",
};

function summarizeFileCounts(files: CommitDetails["files"]): FileChangeCount[] {
  const tally: Record<FileChangeCount["kind"], number> = {
    added: 0,
    edited: 0,
    removed: 0,
  };
  for (const f of files) {
    const kind = STATUS_TO_KIND[f.status] ?? "edited";
    tally[kind]! += 1;
  }
  return (Object.entries(tally) as [FileChangeCount["kind"], number][])
    .filter(([, count]) => count > 0)
    .map(([kind, count]) => ({ kind, count }));
}

function commitToActivityEntry(
  commit: CommitSummary,
  details: CommitDetails | null,
  defaultBranch: string,
): ActivityEntry {
  const { title, subtitle } = splitMessage(commit.message);
  const fileCounts: FileChangeCount[] = details
    ? summarizeFileCounts(details.files)
    : [];
  return {
    kind: "activity",
    id: commit.sha,
    actor: commitAuthorToActor(commit.author),
    occurredAt: commit.authoredAt,
    title,
    subtitle,
    status: "successful" as EntryStatus,
    fileCounts,
    commit: {
      source: `refs/heads/${defaultBranch}`,
      shortSha: commit.sha.slice(0, 7),
      fullSha: commit.sha,
      htmlUrl: commit.htmlUrl,
    },
  };
}

function previewUrlForBranch(branch: string): string {
  const slug = branch
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return `https://mcoe-docs-${slug}.nebula.app`;
}

function commitToPreviewEntry(
  branch: string,
  commit: CommitSummary,
  details: CommitDetails | null,
  owner: string,
  repo: string,
  mockLog: DeploymentLogStep[],
): PreviewEntry {
  const { title, subtitle } = splitMessage(commit.message);
  const previewUrl = previewUrlForBranch(branch);
  const fileCounts = details ? summarizeFileCounts(details.files) : [];
  const filesChanged: FileChange[] = details
    ? details.files.map((f) => ({
        path: f.path,
        url:
          f.htmlUrl ||
          `https://github.com/${owner}/${repo}/blob/${branch}/${f.path}`,
      }))
    : [];

  return {
    kind: "preview",
    id: commit.sha,
    actor: commitAuthorToActor(commit.author),
    occurredAt: commit.authoredAt,
    title,
    subtitle,
    branch,
    status: "successful",
    fileCounts,
    commit: {
      source: `refs/heads/${branch}`,
      shortSha: commit.sha.slice(0, 7),
      fullSha: commit.sha,
      htmlUrl: commit.htmlUrl,
    },
    previewUrl,
    successMessage: `Your changes are now live at ${previewUrl}!`,
    filesChanged,
    log: mockLog,
  };
}

interface LoadResult {
  data: DashboardData;
  /** True when the GH API returned exactly the requested page — there are
   *  likely more commits available to fetch on the next "Load more". */
  hasMoreActivity: boolean;
  /** True when more non-default branches exist beyond the current slice. */
  hasMorePreviews: boolean;
}

async function loadDashboardData(args: {
  installationId: number;
  owner: string;
  repo: string;
  defaultBranch: string;
  activityLimit: number;
  previewLimit: number;
}): Promise<LoadResult> {
  const {
    installationId,
    owner,
    repo,
    defaultBranch,
    activityLimit,
    previewLimit,
  } = args;

  const [activityCommits, branches] = await Promise.all([
    listRecentCommits(installationId, owner, repo, defaultBranch, activityLimit),
    listBranches(installationId, owner, repo),
  ]);

  const activityDetails = await Promise.all(
    activityCommits.map((c) =>
      getCommitDetails(installationId, owner, repo, c.sha).catch(
        () => null as CommitDetails | null,
      ),
    ),
  );

  const candidatePreviewBranches = branches.filter((b) => b !== defaultBranch);
  const previewBranches = candidatePreviewBranches.slice(0, previewLimit);

  const previewLatest = await Promise.all(
    previewBranches.map(async (branch) => {
      const [head] = await listRecentCommits(installationId, owner, repo, branch, 1);
      if (!head) return null;
      const detail = await getCommitDetails(
        installationId,
        owner,
        repo,
        head.sha,
      ).catch(() => null as CommitDetails | null);
      return { branch, commit: head, detail };
    }),
  );

  const head = activityCommits[0];
  const lastUpdatedBy: Actor = head
    ? commitAuthorToActor(head.author)
    : dashboardMockData.deployment.lastUpdatedBy;
  const lastUpdatedAt = head?.authoredAt ?? new Date();

  return {
    data: {
      deployment: {
        siteName: SITE_NAME,
        status: "live",
        domain: MOCK_DOMAIN,
        customDomain: null,
        owner,
        repo,
        branch: defaultBranch,
        lastUpdatedAt,
        lastUpdatedBy,
      },
      activity: activityCommits.map((c, i) =>
        commitToActivityEntry(c, activityDetails[i] ?? null, defaultBranch),
      ),
      previews: previewLatest
        .filter((p): p is NonNullable<typeof p> => p !== null)
        .map(({ branch, commit, detail }) =>
          commitToPreviewEntry(
            branch,
            commit,
            detail,
            owner,
            repo,
            dashboardMockData.previews[0]?.log ?? [],
          ),
        ),
    },
    hasMoreActivity: activityCommits.length === activityLimit,
    hasMorePreviews: candidatePreviewBranches.length > previewLimit,
  };
}

/** Latest webhook-written build per branch, keyed by branch name. */
type BuildsByBranch = Map<string, BuildDoc>;

/**
 * Map a webhook build's status + conclusion onto the dashboard's
 * EntryStatus. The webhook records GitHub's terminology
 * (`status: queued | in_progress | completed`,
 * `conclusion: success | failure | cancelled | timed_out | …`); the
 * dashboard renders `successful | building | failed`.
 */
function statusFromBuild(b: BuildDoc): EntryStatus {
  if (b.status !== "completed") return "building";
  if (b.conclusion === "success") return "successful";
  return "failed";
}

/**
 * Overlay live build state onto a GH-derived PreviewEntry. Branch is the
 * join key — the webhook writes one builds/{run_id} doc per workflow run,
 * and we keep the latest run per branch in `builds`.
 *
 * What gets overlaid: status (so a still-building PR shows as building,
 * not the GH-derived "successful" default) and previewUrl (the webhook /
 * recordPreview callback fills this in). Everything else stays from the
 * GH commit lookup so titles/files/authors keep their human-readable
 * shape — the webhook payload doesn't carry that info.
 */
function enrichPreviewWithBuild(p: PreviewEntry, b: BuildDoc | undefined): PreviewEntry {
  if (!b) return p;
  const next: PreviewEntry = {
    ...p,
    status: statusFromBuild(b),
  };
  if (b.previewUrl) {
    next.previewUrl = b.previewUrl;
    next.successMessage = `Your changes are now live at ${b.previewUrl}!`;
  }
  return next;
}

/** Internal "ready"-shaped state — the public DashboardDataState wraps this
 *  with the action callbacks closed over the hook's setters. */
type ReadyState = {
  status: "ready";
  data: DashboardData;
  hasMoreActivity: boolean;
  hasMorePreviews: boolean;
};
type InternalState =
  | { status: "loading" }
  | { status: "no-repo" }
  | { status: "error"; error: string }
  | ReadyState;

export function useDashboardData(): DashboardDataState {
  const settings = useGitSettings();
  const [state, setState] = useState<InternalState>({ status: "loading" });
  const [reloadCount, setReloadCount] = useState(0);
  const [activityLimit, setActivityLimit] = useState(PAGE_SIZE);
  const [previewLimit, setPreviewLimit] = useState(PAGE_SIZE);
  const [loadingMore, setLoadingMore] = useState(false);
  const [buildsByBranch, setBuildsByBranch] = useState<BuildsByBranch>(
    () => new Map(),
  );

  const refresh = useCallback(() => {
    clearTokenCache();
    setActivityLimit(PAGE_SIZE);
    setPreviewLimit(PAGE_SIZE);
    setReloadCount((n) => n + 1);
  }, []);

  const loadMoreActivity = useCallback(() => {
    setActivityLimit((n) => n + PAGE_SIZE);
  }, []);
  const loadMorePreviews = useCallback(() => {
    setPreviewLimit((n) => n + PAGE_SIZE);
  }, []);

  useEffect(() => {
    if (settings.status === "loading") {
      setState({ status: "loading" });
      return;
    }
    if (settings.status === "missing") {
      setState({ status: "no-repo" });
      return;
    }

    let cancelled = false;
    // Don't flicker the page back to the spinner when the user clicks
    // "Load more" — keep the existing rows visible and surface progress
    // through `loadingMore` instead. The full-page loader only shows on
    // first load (or after an error/refresh).
    setState((prev) =>
      prev.status === "ready" ? prev : { status: "loading" },
    );
    setLoadingMore(true);
    loadDashboardData({
      installationId: settings.settings.installationId,
      owner: settings.settings.owner,
      repo: settings.settings.repo,
      defaultBranch: settings.settings.defaultBranch,
      activityLimit,
      previewLimit,
    })
      .then((result) => {
        if (cancelled) return;
        setLoadingMore(false);
        setState({
          status: "ready",
          data: result.data,
          hasMoreActivity: result.hasMoreActivity,
          hasMorePreviews: result.hasMorePreviews,
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setLoadingMore(false);
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: "error", error: message });
      });
    return () => {
      cancelled = true;
    };
  }, [settings, reloadCount, activityLimit, previewLimit]);

  // Live Firestore subscription on `builds/` for this repo. Independent of
  // the GH-derived data load above — they update on different cadences
  // (GH on mount/refresh, Firestore on every webhook event).
  useEffect(() => {
    if (settings.status !== "ready") {
      setBuildsByBranch(new Map());
      return;
    }
    const fullName = `${settings.settings.owner}/${settings.settings.repo}`;
    const unsub = subscribeBuilds(
      { repoFullName: fullName },
      (builds) => {
        // Keep only the latest build per branch. `receivedAt` is a Firestore
        // serverTimestamp, monotonic enough for "latest" — fall back to runId
        // (an int the webhook event sequence reuses) when timestamps are
        // missing on a freshly-written doc.
        const next: BuildsByBranch = new Map();
        for (const b of builds) {
          if (!b.branch) continue;
          const existing = next.get(b.branch);
          if (
            !existing ||
            (b.receivedAt?.toMillis() ?? b.runId) >
              (existing.receivedAt?.toMillis() ?? existing.runId)
          ) {
            next.set(b.branch, b);
          }
        }
        setBuildsByBranch(next);
      },
      (err) => {
        // Don't fail the whole dashboard if the subscription dies — Activity
        // is still GH-derived. Log and carry on with an empty overlay.
        // eslint-disable-next-line no-console
        console.warn("[dashboard] builds subscription error:", err);
      },
    );
    return unsub;
  }, [settings]);

  // Render-time merge: overlay live build state onto GH-derived previews,
  // then attach the action callbacks the public DashboardDataState exposes.
  // Memoized on (state, buildsByBranch, …) so re-renders don't fan out.
  return useMemo<DashboardDataState>(() => {
    if (state.status === "loading") return { status: "loading" };
    if (state.status === "no-repo") return { status: "no-repo" };
    if (state.status === "error")
      return { status: "error", error: state.error, refresh };

    const data =
      buildsByBranch.size === 0
        ? state.data
        : {
            ...state.data,
            previews: state.data.previews.map((p) =>
              enrichPreviewWithBuild(p, buildsByBranch.get(p.branch)),
            ),
          };
    return {
      status: "ready",
      data,
      refresh,
      hasMoreActivity: state.hasMoreActivity,
      hasMorePreviews: state.hasMorePreviews,
      loadMoreActivity,
      loadMorePreviews,
      loadingMore,
    };
  }, [state, buildsByBranch, refresh, loadMoreActivity, loadMorePreviews, loadingMore]);
}
