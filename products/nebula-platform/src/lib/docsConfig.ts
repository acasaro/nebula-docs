import { useEffect, useState } from 'react';
import { fetchFileContent } from '@/lib/githubApi';

// `docs.json` schema (the subset Nebula renders). Pages can be strings
// (page paths without `.mdx`) or nested groups / page-object entries.

export interface DocsConfig {
  navigation?: { tabs?: Tab[] };
}

export interface Tab {
  tab: string;
  icon?: IconValue;
  hidden?: boolean;
  groups?: Group[];
  /** Mintlify-style direct pages under a tab (no group wrapper). Mixed with
   *  `groups` they render together — pages first by convention. */
  pages?: PageEntry[];
}

export interface Group {
  group: string;
  icon?: IconValue;
  hidden?: boolean;
  tag?: string;
  expanded?: boolean;
  root?: string;
  pages?: PageEntry[];
}

export type PageEntry = string | Group | PageObject;

export interface PageObject {
  page?: string;
  slug?: string;
  sidebarTitle?: string;
  description?: string;
  icon?: IconValue;
  externalUrl?: string;
  ogImage?: string;
  tag?: string;
  hidden?: boolean;
  keywords?: string[];
  mode?: string;
}

// Icon values may be either a plain string (icon name) or an object
// describing the library and style. Nebula only consumes the name for
// rendering today.
export type IconValue =
  | string
  | { name: string; library?: string; style?: string };

export function isGroup(entry: PageEntry): entry is Group {
  return typeof entry === 'object' && entry !== null && 'group' in entry;
}

export function isPageObject(entry: PageEntry): entry is PageObject {
  return typeof entry === 'object' && entry !== null && !('group' in entry);
}

export function iconNameOf(icon: IconValue | undefined): string | undefined {
  if (!icon) return undefined;
  return typeof icon === 'string' ? icon : icon.name;
}

interface UseDocsConfigArgs {
  installationId: number | null;
  owner: string | null;
  repo: string | null;
  ref: string | null;
}

interface UseDocsConfigState {
  config: DocsConfig | null;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches `docs.json` from the connected repo at the given ref and parses it.
 * Returns null config if the file is missing or unparsable — the caller can
 * fall back to a filesystem view in that case.
 */
export function useDocsConfig({
  installationId,
  owner,
  repo,
  ref,
}: UseDocsConfigArgs): UseDocsConfigState {
  const [state, setState] = useState<UseDocsConfigState>({
    config: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    if (!installationId || !owner || !repo || !ref) {
      setState({ config: null, loading: false, error: null });
      return;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));
    fetchFileContent(installationId, owner, repo, 'docs.json', ref)
      .then(({ content }) => {
        if (cancelled) return;
        try {
          const parsed = JSON.parse(content) as DocsConfig;
          setState({ config: parsed, loading: false, error: null });
        } catch (err) {
          setState({
            config: null,
            loading: false,
            error: err instanceof Error ? err.message : 'Invalid docs.json',
          });
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        // Missing docs.json is not an error — caller falls back to file tree.
        const msg = err instanceof Error ? err.message : 'Failed to load';
        const missing = /not a file|not found|404/i.test(msg);
        setState({
          config: null,
          loading: false,
          error: missing ? null : msg,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [installationId, owner, repo, ref]);

  return state;
}

/**
 * Map a page entry to its raw, content-relative path. No subdirectory or
 * `content/` prefix is applied — the returned string is just the page slug
 * with `.mdx` appended.
 *
 *   "documentation/overview" → "documentation/overview.mdx"
 *
 * Returns null if the entry doesn't reference a local page. Use
 * `buildPageEntryResolver` to get the actual repo path that includes the
 * docs subdirectory and `content/` prefix where applicable.
 */
export function pageEntryToFilePath(entry: PageEntry): string | null {
  if (typeof entry === 'string') return `${entry}.mdx`;
  if (isPageObject(entry) && entry.page) return `${entry.page}.mdx`;
  return null;
}

/**
 * Build a resolver that maps a docs.json page entry to the repo path of
 * its MDX file.
 *
 * Tries the Nebula CLI shape first (`<docsSubdirectory>/content/<page>.mdx`),
 * then falls back to the legacy / Mintlify-shaped layout
 * (`<docsSubdirectory>/<page>.mdx`) — same two-candidate pattern the snippet
 * resolver uses, so pre-migration tenants and CLI tenants both work without
 * per-tenant config.
 *
 * When neither candidate exists in `repoPaths` (e.g. a freshly-added entry
 * whose MDX file hasn't been committed yet), the resolver picks the shape
 * the rest of the repo uses: CLI shape if any file under
 * `<docsSubdirectory>/content/` exists, otherwise the root shape.
 */
export function buildPageEntryResolver(
  repoPaths: ReadonlySet<string>,
  docsSubdirectory: string,
): (entry: PageEntry) => string | null {
  const sub = docsSubdirectory.replace(/\/+$/, '');
  const contentPrefix = sub ? `${sub}/content/` : 'content/';
  let hasContentTree = false;
  for (const p of repoPaths) {
    if (p.startsWith(contentPrefix)) {
      hasContentTree = true;
      break;
    }
  }
  return (entry) => {
    const raw = pageEntryToFilePath(entry);
    if (raw === null) return null;
    const cliPath = sub ? `${sub}/content/${raw}` : `content/${raw}`;
    const rootPath = sub ? `${sub}/${raw}` : raw;
    if (repoPaths.has(cliPath)) return cliPath;
    if (repoPaths.has(rootPath)) return rootPath;
    return hasContentTree ? cliPath : rootPath;
  };
}

/**
 * Pretty-print a page path's last segment for display in the tree when no
 * sidebarTitle is provided.
 *   "documentation/format-text" → "Format text"
 *   "accordian"                 → "Accordian"
 */
export function defaultPageTitle(pagePath: string): string {
  const last = pagePath.split('/').pop() ?? pagePath;
  return last
    .replace(/[-_]+/g, ' ')
    .replace(/^(.)/, (c) => c.toUpperCase());
}
