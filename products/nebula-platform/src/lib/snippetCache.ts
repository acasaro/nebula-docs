import { useEffect, useRef } from 'react';
import { fetchFileContent } from '@/lib/githubApi';

/**
 * Snippet files are referenced from page MDX as `<Snippet file="x" />`. Their
 * source content lives at `<snippetsBase>/x.mdx` in the repo. The Platform
 * pre-fetches every snippet file alongside the page-level frontmatter cache
 * so that when an MDX page mounts in the editor, the snippet resolver can
 * synchronously satisfy the lookup.
 *
 * If a snippet hasn't loaded by the time the editor mounts, the snippet
 * NodeView renders a "not found" placeholder until the fetch lands and the
 * NodeView re-renders against the populated cache.
 */
export interface SnippetCacheEntry {
  /** Mirrors {@link FileEntry} on RepoBrowser so existing dirty-tracking and
   *  commit flows continue to work for snippet files the user opens to edit. */
  original: string;
  draft: string;
  sha: string;
  revertNonce: number;
}

interface UseSnippetPrefetchArgs {
  installationId: number | null;
  owner: string | null;
  repo: string | null;
  ref: string | null;
  /** Repo-root-relative paths from the file tree. The hook filters for
   *  snippet files and fetches only those. */
  allPaths: readonly string[];
  /** Candidate directories holding snippets, repo-root-relative
   *  (e.g. `["content/snippets"]` for Nebula-shaped tenants, or
   *  `["content/snippets", "snippets"]` to also support Mintlify-shaped
   *  tenants pre-migration). The first candidate that resolves wins. */
  snippetsBases: readonly string[];
  /** Files already loaded by the parent — anything present here is skipped
   *  (covers both already-fetched snippets and the open page itself). */
  loadedPaths: Set<string>;
  /** Push a freshly-fetched snippet into the parent's `files` map. */
  onLoad: (path: string, entry: SnippetCacheEntry) => void;
}

const CONCURRENCY = 4;

/**
 * Prefetch every `<snippetsBase>/*.mdx` referenced by the file tree. Runs
 * once per branch + base-dir change, with bounded concurrency so a tenant
 * with hundreds of snippets doesn't hammer the GitHub API.
 */
export function useSnippetPrefetch({
  installationId,
  owner,
  repo,
  ref,
  allPaths,
  snippetsBases,
  loadedPaths,
  onLoad,
}: UseSnippetPrefetchArgs): void {
  // Latch latest props in refs so the effect's deps stay narrow — re-running
  // the prefetch on every parent re-render would burn API quota.
  const onLoadRef = useRef(onLoad);
  useEffect(() => {
    onLoadRef.current = onLoad;
  }, [onLoad]);
  const loadedRef = useRef(loadedPaths);
  useEffect(() => {
    loadedRef.current = loadedPaths;
  }, [loadedPaths]);

  useEffect(() => {
    if (!installationId || !owner || !repo || !ref) return;
    const prefixes = snippetsBases.map((b) => `${b.replace(/\/+$/, '')}/`);
    const targets = allPaths.filter(
      (p) =>
        p.endsWith('.mdx') &&
        prefixes.some((pre) => p.startsWith(pre)) &&
        !loadedRef.current.has(p),
    );
    if (targets.length === 0) return;

    let cancelled = false;
    const queue = [...targets];
    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }).map(
      async () => {
        while (!cancelled) {
          const path = queue.shift();
          if (!path) return;
          try {
            const { content, sha } = await fetchFileContent(
              installationId,
              owner,
              repo,
              path,
              ref,
            );
            if (cancelled) return;
            onLoadRef.current(path, {
              original: content,
              draft: content,
              sha,
              revertNonce: 0,
            });
          } catch {
            // Snippet fetch failures are silent — the resolver returns
            // `undefined` for the file and the NodeView renders the
            // missing-snippet placeholder.
          }
        }
      },
    );
    void Promise.all(workers);

    return () => {
      cancelled = true;
    };
    // `loadedPaths` is intentionally read via ref above; including it as a dep
    // would re-run the prefetch every time a single fetch lands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installationId, owner, repo, ref, allPaths, snippetsBases]);
}

/**
 * Build the resolver function the editor passes to `SnippetResolverProvider`.
 * Tries each `snippetsBase` in order (`["content/snippets", "snippets"]` for
 * tenants that may be either Nebula- or Mintlify-shaped) and returns the
 * current draft from the first match. Reading from `draft` (rather than
 * `original`) means editing a snippet file in another tab updates the
 * resolved content live.
 */
export function buildSnippetResolver(
  files: Record<string, { draft: string }>,
  snippetsBases: readonly string[],
): (file: string) => string | undefined {
  const prefixes = snippetsBases.map((b) => b.replace(/\/+$/, ''));
  return (file: string) => {
    const cleaned = file.replace(/^\/+/, '').replace(/\.mdx?$/i, '');
    for (const prefix of prefixes) {
      const path = `${prefix}/${cleaned}.mdx`;
      const entry = files[path];
      if (entry) return entry.draft;
    }
    return undefined;
  };
}

/**
 * Pick the first base that actually has snippet files in the repo (so the
 * "open source" link points at the right path even on Mintlify-shaped
 * tenants where the convention is `snippets/` at root). Falls back to the
 * first listed base when no snippet files have been discovered yet.
 */
export function pickActiveSnippetsBase(
  allPaths: readonly string[],
  snippetsBases: readonly string[],
): string {
  const prefixes = snippetsBases.map((b) => b.replace(/\/+$/, ''));
  for (const prefix of prefixes) {
    const candidate = `${prefix}/`;
    if (allPaths.some((p) => p.startsWith(candidate) && p.endsWith('.mdx'))) {
      return prefix;
    }
  }
  return prefixes[0] ?? 'content/snippets';
}
