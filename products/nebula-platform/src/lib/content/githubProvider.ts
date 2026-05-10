/**
 * GitHub-backed content provider. Thin re-export of the existing
 * `githubApi` module — the surface kept here is exactly what the editor,
 * dashboard, and config caches consume. Provider selection happens in
 * `./index.ts`; consumers never import this file directly.
 */
export {
  fetchRepoTree,
  fetchFileContent,
  listBranches,
  createBranch,
  commitFiles,
  createPullRequest,
  enableAutoMerge,
  fetchPullRequest,
  listRecentCommits,
  getCommitDetails,
} from '@/lib/githubApi';

export type {
  RepoTreeResult,
  FileChange,
  CommitAuthor,
  CommitSummary,
  CommitFileChange,
  CommitDetails,
  MergeMethod,
  PullRequestState,
} from '@/lib/githubApi';
