import { useEffect, useMemo, useRef } from 'react';
import { bindingNameFromPath } from '@nebula-docs/mdx';
import { fetchFileContent } from '@/lib/content';
import type { SnippetCatalogEntry } from '@/lib/mdx/snippetResolver';

/**
 * Snippet files are referenced from page MDX as
 * `import Disclaimer from "/snippets/disclaimer.mdx"; <Disclaimer />`. The
 * Platform pre-fetches every snippet file alongside the page-level
 * frontmatter cache so that when an MDX page mounts in the editor, the
 * snippet resolver can synchronously satisfy the lookup.
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
  /** Files already loaded by the parent — anything present here is skipped. */
  loadedPaths: Set<string>;
  /** Push a freshly-fetched snippet into the parent's `files` map. */
  onLoad: (path: string, entry: SnippetCacheEntry) => void;
}

const CONCURRENCY = 4;
const SNIPPET_EXTENSIONS = /\.(mdx?|jsx?|tsx?)$/i;

/**
 * Prefetch every snippet file referenced by the file tree. Runs once per
 * branch + base-dir change, with bounded concurrency.
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
        SNIPPET_EXTENSIONS.test(p) &&
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
            // Silent — resolver returns undefined and the NodeView shows the
            // missing-snippet placeholder.
          }
        }
      },
    );
    void Promise.all(workers);

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installationId, owner, repo, ref, allPaths, snippetsBases]);
}

/**
 * Map an MDX import path (`/snippets/disclaimer.mdx`, `../shared/foo.mdx`,
 * `/shared/lib.mdx`) to a repo-root-relative path that matches a key in the
 * loaded `files` map.
 *
 * For absolute paths (`/...`), strip the leading slash and prepend any
 * configured `docsSubdirectory` so resolution lines up with how
 * `fetchRepoTree` returns paths. Relative paths are normalized against the
 * current page's directory (caller's responsibility — see `withCurrentDir`).
 */
export function importPathToRepoPath(
  importPath: string,
  docsSubdirectory: string,
): string {
  const sub = docsSubdirectory.replace(/\/+$/, '');
  const cleaned = importPath.replace(/^\/+/, '');
  return sub ? `${sub}/${cleaned}` : cleaned;
}

/**
 * Build a path-keyed resolver for the editor. Tries each `snippetsBase` to
 * locate `/snippets/foo.mdx` against either a Nebula `content/snippets/foo`
 * shape or a Mintlify `snippets/foo` shape (whichever the tenant uses), so
 * pre-migration repos work without per-tenant config. Returns the current
 * `draft` so unsaved snippet edits show up live in every page that
 * references them.
 */
export function buildSnippetResolver(
  files: Record<string, { draft: string }>,
  snippetsBases: readonly string[],
  docsSubdirectory: string,
): (importPath: string) => string | undefined {
  const sub = docsSubdirectory.replace(/\/+$/, '');
  return (importPath: string) => {
    // 1. Direct map: strip leading `/`, prepend subdir, look it up.
    const direct = importPathToRepoPath(importPath, docsSubdirectory);
    if (files[direct]?.draft !== undefined) return files[direct].draft;

    // 2. Mintlify-shaped fallback: `/snippets/foo.mdx` → try each base in
    //    case the tenant's snippets live at `content/snippets/` or just
    //    `snippets/`. Strip the leading-slash convention's `snippets/`
    //    prefix and re-anchor against each base.
    const cleaned = importPath.replace(/^\/+/, '');
    const SHAPED = /^(snippets|shared)\/(.+)$/;
    const shaped = cleaned.match(SHAPED);
    if (shaped) {
      const tail = shaped[2]!;
      for (const baseRaw of snippetsBases) {
        const base = baseRaw.replace(/\/+$/, '');
        const prefixed = sub
          ? `${sub}/${base}/${tail}`
          : `${base}/${tail}`;
        if (files[prefixed]?.draft !== undefined) return files[prefixed].draft;
      }
    }
    return undefined;
  };
}

/**
 * Match an import path back to an actual repo path the "open source" link
 * can navigate to. Same fallback logic as `buildSnippetResolver` but
 * returns the repo path (or the direct guess if nothing matches).
 */
export function buildRepoPathResolver(
  files: Record<string, { draft: string }>,
  snippetsBases: readonly string[],
  docsSubdirectory: string,
): (importPath: string) => string {
  const sub = docsSubdirectory.replace(/\/+$/, '');
  return (importPath: string) => {
    const direct = importPathToRepoPath(importPath, docsSubdirectory);
    if (files[direct]) return direct;
    const cleaned = importPath.replace(/^\/+/, '');
    const SHAPED = /^(snippets|shared)\/(.+)$/;
    const shaped = cleaned.match(SHAPED);
    if (shaped) {
      const tail = shaped[2]!;
      for (const baseRaw of snippetsBases) {
        const base = baseRaw.replace(/\/+$/, '');
        const prefixed = sub ? `${sub}/${base}/${tail}` : `${base}/${tail}`;
        if (files[prefixed]) return prefixed;
      }
    }
    return direct;
  };
}

/**
 * Build the slash-command catalog from the prefetched snippet files. Each
 * entry carries the `/`-rooted import path the editor writes into the
 * import statement, plus the repo-root-relative path for navigation.
 */
export function useSnippetCatalog(
  files: Record<string, unknown>,
  snippetsBases: readonly string[],
  docsSubdirectory: string,
): readonly SnippetCatalogEntry[] {
  const sub = docsSubdirectory.replace(/\/+$/, '');
  return useMemo(() => {
    const out: SnippetCatalogEntry[] = [];
    const seen = new Set<string>();
    const prefixes = snippetsBases.map((b) => `${b.replace(/\/+$/, '')}/`);
    for (const p of Object.keys(files)) {
      if (!SNIPPET_EXTENSIONS.test(p)) continue;
      const matchesPrefix = prefixes.some((pre) =>
        sub ? p.startsWith(`${sub}/${pre}`) : p.startsWith(pre),
      );
      if (!matchesPrefix) continue;
      // Re-derive the `/`-rooted import path. The actual repo path may live
      // under `<sub>/content/snippets/foo` or `<sub>/snippets/foo` — Mintlify
      // canonicalizes to `/snippets/foo` regardless, so do the same.
      const repoTail = sub && p.startsWith(`${sub}/`) ? p.slice(sub.length + 1) : p;
      const importPath = canonicalizeToImportPath(repoTail);
      if (seen.has(importPath)) continue;
      seen.add(importPath);
      out.push({
        importPath,
        repoPath: p,
        defaultBinding: bindingNameFromPath(p),
        isReact: /\.(jsx|tsx)$/i.test(p),
      });
    }
    out.sort((a, b) => a.importPath.localeCompare(b.importPath));
    return out;
  }, [files, snippetsBases, sub]);
}

function canonicalizeToImportPath(repoRelative: string): string {
  // Strip leading `content/` so both `content/snippets/foo.mdx` and
  // `snippets/foo.mdx` canonicalize to the same `/snippets/foo.mdx` import.
  const stripped = repoRelative.replace(/^content\//, '');
  return `/${stripped}`;
}
