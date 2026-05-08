/**
 * localStorage-backed persistence for unsaved editor drafts so a browser
 * refresh — or a branch switch and switch back — doesn't drop the in-progress
 * change set. Drafts are scoped per `(installationId, owner, repo, branch)`
 * tuple; in-memory dirty entries are mirrored here, and removed when the
 * user reverts or successfully publishes.
 */

export interface StoredDraftEntry {
  original: string;
  draft: string;
  sha: string;
  revertNonce: number;
}

export interface StoredDraftBundle {
  files: Record<string, StoredDraftEntry>;
  deletions: string[];
}

export interface DraftScope {
  installationId: string;
  owner: string;
  repo: string;
  branch: string;
}

const KEY_PREFIX = 'nebula:drafts:v1';
const EMPTY_BUNDLE: StoredDraftBundle = { files: {}, deletions: [] };

export function makeDraftScopeKey(scope: DraftScope): string {
  return `${KEY_PREFIX}:${scope.installationId}:${scope.owner}/${scope.repo}@${scope.branch}`;
}

export function loadDrafts(scopeKey: string): StoredDraftBundle {
  if (typeof window === 'undefined') return { files: {}, deletions: [] };
  const raw = window.localStorage.getItem(scopeKey);
  if (!raw) return { files: {}, deletions: [] };
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const files =
        parsed.files && typeof parsed.files === 'object'
          ? (parsed.files as Record<string, StoredDraftEntry>)
          : {};
      const deletions = Array.isArray(parsed.deletions)
        ? (parsed.deletions as string[])
        : [];
      return { files, deletions };
    }
  } catch {
    // Corrupt entry — drop it so we don't keep failing on the same blob.
    window.localStorage.removeItem(scopeKey);
  }
  return { files: {}, deletions: [] };
}

export function saveDrafts(scopeKey: string, bundle: StoredDraftBundle): void {
  if (typeof window === 'undefined') return;
  if (
    Object.keys(bundle.files).length === 0 &&
    bundle.deletions.length === 0
  ) {
    window.localStorage.removeItem(scopeKey);
    return;
  }
  try {
    window.localStorage.setItem(scopeKey, JSON.stringify(bundle));
  } catch {
    // Quota exceeded or storage disabled — silently skip; the in-memory
    // edits are still live, just won't survive refresh.
  }
}

export function clearDrafts(scopeKey: string): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(scopeKey);
}

export { EMPTY_BUNDLE };
