/**
 * Local filesystem content provider. Talks to the dev-only Vite middleware
 * (see `vite-plugin-local-tenant.ts`) which reads/writes a tenant directory
 * under `tenants/<name>/`. Function signatures match the GitHub provider so
 * consumers can swap providers via env without changing call sites.
 *
 * Branches and pull requests are not modeled on disk — those entry points
 * throw so the editor surfaces a clear "not in local mode" error if a user
 * triggers them.
 */
import type {
  RepoTreeResult,
  FileChange,
  CommitDetails,
  CommitSummary,
} from '@/lib/githubApi';

const FS_BASE = '/api/fs';

async function jsonFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${FS_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Local FS ${path} → ${res.status}: ${text || res.statusText}`);
  }
  return res.json() as Promise<T>;
}

export async function fetchRepoTree(
  _installationId: number,
  _owner: string,
  _repo: string,
  _ref: string,
): Promise<RepoTreeResult> {
  return jsonFetch<RepoTreeResult>('/tree');
}

export async function fetchFileContent(
  _installationId: number,
  _owner: string,
  _repo: string,
  path: string,
  _ref: string,
): Promise<{ content: string; sha: string }> {
  return jsonFetch<{ content: string; sha: string }>(
    `/file?path=${encodeURIComponent(path)}`,
  );
}

export async function listBranches(
  _installationId: number,
  _owner: string,
  _repo: string,
): Promise<string[]> {
  return ['local'];
}

export async function createBranch(
  _installationId: number,
  _owner: string,
  _repo: string,
  _baseBranch: string,
  newBranch: string,
): Promise<{ name: string; sha: string }> {
  throw new Error(
    `Branches aren't supported in local mode — already editing the on-disk tenant. (attempted: ${newBranch})`,
  );
}

export async function commitFiles(
  _installationId: number,
  _owner: string,
  _repo: string,
  _branch: string,
  changes: readonly FileChange[],
  message: string,
): Promise<{ commitSha: string }> {
  if (changes.length === 0) throw new Error('No changes to commit.');
  return jsonFetch<{ commitSha: string }>('/commit', {
    method: 'POST',
    body: JSON.stringify({ changes, message }),
  });
}

export async function createPullRequest(
  _installationId: number,
  _owner: string,
  _repo: string,
  _head: string,
  _base: string,
  _title: string,
  _body: string,
): Promise<{ number: number; url: string; nodeId: string }> {
  throw new Error(
    "Pull requests aren't supported in local mode — your edits are written directly to the tenant on disk.",
  );
}

export type MergeMethod = 'MERGE' | 'SQUASH' | 'REBASE';

export async function enableAutoMerge(
  _installationId: number,
  _prNodeId: string,
  _mergeMethod?: MergeMethod,
): Promise<void> {
  throw new Error("Auto-merge isn't supported in local mode.");
}

export interface PullRequestState {
  state: 'open' | 'closed';
  merged: boolean;
  mergedAt: string | null;
  htmlUrl: string;
}

export async function fetchPullRequest(
  _installationId: number,
  _owner: string,
  _repo: string,
  _pullNumber: number,
): Promise<PullRequestState> {
  throw new Error("Pull request polling isn't supported in local mode.");
}

export async function listRecentCommits(
  _installationId: number,
  _owner: string,
  _repo: string,
  _branch: string,
  _perPage: number = 20,
): Promise<CommitSummary[]> {
  return [];
}

export async function getCommitDetails(
  _installationId: number,
  _owner: string,
  _repo: string,
  sha: string,
): Promise<CommitDetails> {
  return {
    sha,
    message: '(local)',
    htmlUrl: '',
    authoredAt: new Date(),
    author: { login: null, name: 'local', email: null, avatarUrl: null, type: null },
    additions: 0,
    deletions: 0,
    files: [],
  };
}
