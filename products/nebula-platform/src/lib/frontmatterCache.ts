import { useEffect, useRef, useState } from 'react';
import { fetchFileContent } from '@/lib/githubApi';
import { splitFrontmatter } from '@/lib/frontmatter';

export type FrontmatterValues = Record<string, unknown>;

export type FrontmatterCache = Record<string, FrontmatterValues | null>;

interface UseFrontmatterCacheArgs {
  installationId: number | null;
  owner: string | null;
  repo: string | null;
  ref: string | null;
  /** All MDX/MD paths to load. The hook lazily fetches each one. */
  paths: readonly string[];
  /** Pre-loaded files map keyed by path. Anything present here is parsed
   *  inline rather than re-fetched, which keeps the cache in sync with
   *  in-editor edits. */
  knownFiles?: Record<string, { draft: string }>;
}

export interface UseFrontmatterCacheState {
  cache: FrontmatterCache;
  /** Paths that have been fetched (whether parse succeeded or not). */
  loaded: Set<string>;
  loading: boolean;
}

const CONCURRENCY = 6;

/**
 * Lazily fetch and parse the YAML frontmatter for every MDX path in `paths`.
 * Returns a growing cache keyed by file path. Designed for the navigation
 * sidebar to surface page-level overrides (sidebarTitle, icon, tag) without
 * keeping each file's full body in memory.
 *
 * Editor drafts override the fetched copy: if `knownFiles[path]` is set,
 * the parser uses that draft instead of fetching, so the sidebar updates
 * immediately as the user edits frontmatter in the page-settings panel.
 */
export function useFrontmatterCache({
  installationId,
  owner,
  repo,
  ref,
  paths,
  knownFiles,
}: UseFrontmatterCacheArgs): UseFrontmatterCacheState {
  const [cache, setCache] = useState<FrontmatterCache>({});
  const [loaded, setLoaded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const inFlightRef = useRef<Set<string>>(new Set());

  // Keep cache aligned with editor drafts as soon as we have them.
  useEffect(() => {
    if (!knownFiles) return;
    setCache((prev) => {
      let changed = false;
      const next: FrontmatterCache = { ...prev };
      for (const [path, entry] of Object.entries(knownFiles)) {
        if (!isMdxPath(path)) continue;
        const parsed = splitFrontmatter(entry.draft).frontmatter;
        const values = parsed?.values ?? null;
        // Shallow-compare to skip pointless re-renders.
        if (!shallowEqualOrBothNull(prev[path], values)) {
          next[path] = values;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [knownFiles]);

  // Fan out fetches with bounded concurrency on every paths/branch change.
  useEffect(() => {
    if (!installationId || !owner || !repo || !ref) return;
    const targets = paths.filter(
      (p) =>
        isMdxPath(p) &&
        !loaded.has(p) &&
        !inFlightRef.current.has(p) &&
        !knownFiles?.[p],
    );
    if (targets.length === 0) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    targets.forEach((p) => inFlightRef.current.add(p));

    const queue = [...targets];
    const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }).map(
      async () => {
        while (!cancelled) {
          const path = queue.shift();
          if (!path) return;
          try {
            const { content } = await fetchFileContent(
              installationId,
              owner,
              repo,
              path,
              ref,
            );
            if (cancelled) return;
            const parsed = splitFrontmatter(content).frontmatter;
            setCache((prev) =>
              shallowEqualOrBothNull(prev[path], parsed?.values ?? null)
                ? prev
                : { ...prev, [path]: parsed?.values ?? null },
            );
          } catch {
            if (cancelled) return;
            setCache((prev) => (path in prev ? prev : { ...prev, [path]: null }));
          } finally {
            inFlightRef.current.delete(path);
            if (!cancelled) {
              setLoaded((prev) => {
                if (prev.has(path)) return prev;
                const next = new Set(prev);
                next.add(path);
                return next;
              });
            }
          }
        }
      },
    );

    Promise.all(workers).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
    // `loaded` is read but intentionally not a dep — adding it would re-run
    // every time a single fetch finishes and re-trigger half the queue.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [installationId, owner, repo, ref, paths, knownFiles]);

  return { cache, loaded, loading };
}

function isMdxPath(p: string): boolean {
  return p.endsWith('.mdx') || p.endsWith('.md');
}

function shallowEqualOrBothNull(
  a: FrontmatterValues | null | undefined,
  b: FrontmatterValues | null | undefined,
): boolean {
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (const k of keysA) {
    if (a[k] !== b[k]) return false;
  }
  return true;
}
