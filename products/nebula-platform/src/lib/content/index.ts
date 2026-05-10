/**
 * Content provider façade. Selects between the GitHub backend (default,
 * production) and the local-filesystem backend (`NEBULA_BACKEND=local`,
 * dev-only) once at module load and re-exports the chosen provider's
 * functions under stable names.
 *
 * Consumers import from `@/lib/content` instead of `@/lib/githubApi` so
 * the editor, dashboard, and config caches all swap together. Surface is
 * deliberately identical to `githubApi` — see `./githubProvider.ts` for
 * the canonical signatures.
 */
import { env } from '@/lib/env';
import * as github from './githubProvider';
import * as fs from './fsProvider';

const provider = env.isLocalBackend ? fs : github;

export const fetchRepoTree = provider.fetchRepoTree;
export const fetchFileContent = provider.fetchFileContent;
export const listBranches = provider.listBranches;
export const createBranch = provider.createBranch;
export const commitFiles = provider.commitFiles;
export const createPullRequest = provider.createPullRequest;
export const enableAutoMerge = provider.enableAutoMerge;
export const listRecentCommits = provider.listRecentCommits;
export const getCommitDetails = provider.getCommitDetails;

export type {
  RepoTreeResult,
  FileChange,
  CommitAuthor,
  CommitSummary,
  CommitFileChange,
  CommitDetails,
  MergeMethod,
} from './githubProvider';
