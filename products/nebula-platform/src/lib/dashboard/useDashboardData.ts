import { useCallback, useEffect, useState } from "react";
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
  | { status: "ready"; data: DashboardData; refresh: () => void };

const ACTIVITY_LIMIT = 15;
const PREVIEW_BRANCH_LIMIT = 10;
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

async function loadDashboardData(args: {
  installationId: number;
  owner: string;
  repo: string;
  defaultBranch: string;
}): Promise<DashboardData> {
  const { installationId, owner, repo, defaultBranch } = args;

  const [activityCommits, branches] = await Promise.all([
    listRecentCommits(installationId, owner, repo, defaultBranch, ACTIVITY_LIMIT),
    listBranches(installationId, owner, repo),
  ]);

  const activityDetails = await Promise.all(
    activityCommits.map((c) =>
      getCommitDetails(installationId, owner, repo, c.sha).catch(
        () => null as CommitDetails | null,
      ),
    ),
  );

  const previewBranches = branches
    .filter((b) => b !== defaultBranch)
    .slice(0, PREVIEW_BRANCH_LIMIT);

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
  };
}

export function useDashboardData(): DashboardDataState {
  const settings = useGitSettings();
  const [state, setState] = useState<DashboardDataState>({ status: "loading" });
  const [reloadCount, setReloadCount] = useState(0);

  const refresh = useCallback(() => {
    clearTokenCache();
    setReloadCount((n) => n + 1);
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
    setState({ status: "loading" });
    loadDashboardData({
      installationId: settings.settings.installationId,
      owner: settings.settings.owner,
      repo: settings.settings.repo,
      defaultBranch: settings.settings.defaultBranch,
    })
      .then((data) => {
        if (cancelled) return;
        setState({ status: "ready", data, refresh });
      })
      .catch((err) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: "error", error: message, refresh });
      });
    return () => {
      cancelled = true;
    };
  }, [settings, reloadCount, refresh]);

  return state;
}
