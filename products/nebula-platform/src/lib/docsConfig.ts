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
 * Resolve a page entry's path to an MDX file path in the repo.
 * "documentation/overview" → "documentation/overview.mdx"
 * Returns null if the entry doesn't reference a local page.
 */
export function pageEntryToFilePath(entry: PageEntry): string | null {
  if (typeof entry === 'string') return `${entry}.mdx`;
  if (isPageObject(entry) && entry.page) return `${entry.page}.mdx`;
  return null;
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
