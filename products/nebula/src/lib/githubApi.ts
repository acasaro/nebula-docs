import { Octokit } from '@octokit/rest';
import { getApp } from '@nebula-docs/firebase';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { mintGithubInstallationToken } from '@/lib/githubToken';

export interface InstallationRepo {
  name: string;
  owner: string;
  fullName: string;
  defaultBranch: string;
  private: boolean;
}

export interface InstallationInfo {
  installationId: number;
  account: { login: string; type: 'User' | 'Organization' };
  repositorySelection: 'all' | 'selected';
}

async function octokitFor(installationId: number): Promise<Octokit> {
  const { token } = await mintGithubInstallationToken(installationId);
  return new Octokit({ auth: token });
}

export async function fetchInstallation(installationId: number): Promise<InstallationInfo> {
  const fn = httpsCallable<{ installationId: number }, InstallationInfo>(
    getFunctions(getApp()),
    'getInstallation',
  );
  const result = await fn({ installationId });
  return result.data;
}

export async function listInstallationRepos(
  installationId: number,
): Promise<InstallationRepo[]> {
  const oct = await octokitFor(installationId);
  const repos = await oct.paginate(oct.apps.listReposAccessibleToInstallation, {
    per_page: 100,
  });
  return repos.map((r) => ({
    name: r.name,
    owner: r.owner.login,
    fullName: r.full_name,
    defaultBranch: r.default_branch,
    private: r.private,
  }));
}

export async function listBranches(
  installationId: number,
  owner: string,
  repo: string,
): Promise<string[]> {
  const oct = await octokitFor(installationId);
  const branches = await oct.paginate(oct.repos.listBranches, {
    owner,
    repo,
    per_page: 100,
  });
  return branches.map((b) => b.name);
}

export interface RepoTreeResult {
  paths: string[];
  truncated: boolean;
  treeSha: string;
}

export async function fetchRepoTree(
  installationId: number,
  owner: string,
  repo: string,
  ref: string,
): Promise<RepoTreeResult> {
  const oct = await octokitFor(installationId);
  const { data: branch } = await oct.repos.getBranch({ owner, repo, branch: ref });
  const treeSha = branch.commit.commit.tree.sha;
  const { data } = await oct.git.getTree({
    owner,
    repo,
    tree_sha: treeSha,
    recursive: 'true',
  });
  return {
    paths: data.tree
      .filter((item) => item.type === 'blob' && item.path)
      .map((item) => item.path!),
    truncated: data.truncated ?? false,
    treeSha,
  };
}

export async function fetchFileContent(
  installationId: number,
  owner: string,
  repo: string,
  path: string,
  ref: string,
): Promise<{ content: string; sha: string }> {
  const oct = await octokitFor(installationId);
  const { data } = await oct.repos.getContent({ owner, repo, path, ref });
  if (Array.isArray(data) || data.type !== 'file') {
    throw new Error(`Not a file: ${path}`);
  }
  if (!data.content) {
    throw new Error(`No content returned for ${path}`);
  }
  const cleaned = data.content.replace(/\s/g, '');
  const bytes = Uint8Array.from(atob(cleaned), (c) => c.charCodeAt(0));
  const content = new TextDecoder('utf-8').decode(bytes);
  return { content, sha: data.sha };
}

export async function createBranch(
  installationId: number,
  owner: string,
  repo: string,
  baseBranch: string,
  newBranch: string,
): Promise<{ name: string; sha: string }> {
  const oct = await octokitFor(installationId);
  const { data: base } = await oct.git.getRef({
    owner,
    repo,
    ref: `heads/${baseBranch}`,
  });
  await oct.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${newBranch}`,
    sha: base.object.sha,
  });
  return { name: newBranch, sha: base.object.sha };
}

export interface FileChange {
  path: string;
  /** UTF-8 file content. */
  content: string;
}

/**
 * Commit a batch of file changes to a branch as a single commit. Uses the
 * Git Data API (blobs → tree → commit → updateRef) so all files land
 * together rather than as N individual commits.
 */
export async function commitFiles(
  installationId: number,
  owner: string,
  repo: string,
  branch: string,
  changes: readonly FileChange[],
  message: string,
): Promise<{ commitSha: string }> {
  if (changes.length === 0) throw new Error('No changes to commit.');
  const oct = await octokitFor(installationId);
  const { data: ref } = await oct.git.getRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  const parentSha = ref.object.sha;
  const { data: parentCommit } = await oct.git.getCommit({
    owner,
    repo,
    commit_sha: parentSha,
  });
  const blobs = await Promise.all(
    changes.map((c) =>
      oct.git
        .createBlob({ owner, repo, content: c.content, encoding: 'utf-8' })
        .then((res) => ({ path: c.path, sha: res.data.sha })),
    ),
  );
  const { data: tree } = await oct.git.createTree({
    owner,
    repo,
    base_tree: parentCommit.tree.sha,
    tree: blobs.map((b) => ({
      path: b.path,
      mode: '100644',
      type: 'blob',
      sha: b.sha,
    })),
  });
  const { data: commit } = await oct.git.createCommit({
    owner,
    repo,
    message,
    tree: tree.sha,
    parents: [parentSha],
  });
  await oct.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: commit.sha,
  });
  return { commitSha: commit.sha };
}

export interface CommitAuthor {
  /** GitHub login when the commit is linked to a GitHub account. */
  login: string | null;
  /** Git author name (always present). */
  name: string | null;
  /** Git author email (always present, sometimes a `noreply` form). */
  email: string | null;
  avatarUrl: string | null;
  /** GitHub user type when the commit is linked to a GitHub account. */
  type: "User" | "Bot" | "Organization" | null;
}

export interface CommitSummary {
  sha: string;
  message: string;
  htmlUrl: string;
  authoredAt: Date;
  author: CommitAuthor;
}

export interface CommitFileChange {
  path: string;
  status: string;
  additions: number;
  deletions: number;
  htmlUrl: string;
}

export interface CommitDetails extends CommitSummary {
  files: CommitFileChange[];
  additions: number;
  deletions: number;
}

function mapAuthor(
  ghAuthor: { login?: string; avatar_url?: string; type?: string } | null | undefined,
  gitAuthor: { name?: string | null; email?: string | null } | null | undefined,
): CommitAuthor {
  return {
    login: ghAuthor?.login ?? null,
    name: gitAuthor?.name ?? null,
    email: gitAuthor?.email ?? null,
    avatarUrl: ghAuthor?.avatar_url ?? null,
    type:
      ghAuthor?.type === "User" ||
      ghAuthor?.type === "Bot" ||
      ghAuthor?.type === "Organization"
        ? ghAuthor.type
        : null,
  };
}

export async function listRecentCommits(
  installationId: number,
  owner: string,
  repo: string,
  branch: string,
  perPage: number = 20,
): Promise<CommitSummary[]> {
  const oct = await octokitFor(installationId);
  const { data } = await oct.repos.listCommits({
    owner,
    repo,
    sha: branch,
    per_page: perPage,
  });
  return data.map((c) => ({
    sha: c.sha,
    message: c.commit.message,
    htmlUrl: c.html_url,
    authoredAt: new Date(c.commit.author?.date ?? Date.now()),
    author: mapAuthor(c.author, c.commit.author),
  }));
}

export async function getCommitDetails(
  installationId: number,
  owner: string,
  repo: string,
  sha: string,
): Promise<CommitDetails> {
  const oct = await octokitFor(installationId);
  const { data } = await oct.repos.getCommit({ owner, repo, ref: sha });
  return {
    sha: data.sha,
    message: data.commit.message,
    htmlUrl: data.html_url,
    authoredAt: new Date(data.commit.author?.date ?? Date.now()),
    author: mapAuthor(data.author, data.commit.author),
    additions: data.stats?.additions ?? 0,
    deletions: data.stats?.deletions ?? 0,
    files: (data.files ?? []).map((f) => ({
      path: f.filename,
      status: f.status,
      additions: f.additions ?? 0,
      deletions: f.deletions ?? 0,
      htmlUrl: f.blob_url ?? f.raw_url ?? "",
    })),
  };
}

export async function createPullRequest(
  installationId: number,
  owner: string,
  repo: string,
  head: string,
  base: string,
  title: string,
  body: string,
): Promise<{ number: number; url: string }> {
  const oct = await octokitFor(installationId);
  const { data } = await oct.pulls.create({
    owner,
    repo,
    head,
    base,
    title,
    body,
  });
  return { number: data.number, url: data.html_url };
}
