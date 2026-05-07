import { useEffect, useState } from 'react';
import { fetchFileContent } from '@/lib/content';

// `docs.json` schema (the subset Nebula renders). Pages can be strings
// (page paths without `.mdx`) or nested groups / page-object entries.

export interface DocsConfig {
  navigation?: {
    /** Top-level tabs — Mintlify's primary organizational pattern. When
     *  present, the sidebar mirrors the active tab's children. */
    tabs?: Tab[];
    /** Root-level pages alongside tabs/groups (Mintlify allows root pages
     *  without a tabs wrapper). When tabs are also present, root pages and
     *  groups render after the active tab's tree in the sidebar. */
    pages?: PageEntry[];
    /** Root-level groups (Mintlify allows root groups without a tabs
     *  wrapper). Same render rules as `pages`. */
    groups?: Group[];
    /** Persistent items above the sidebar groups. Each anchor either holds
     *  child pages/groups (collapsible section) or has `href` (link). */
    anchors?: Anchor[];
    /** Expandable dropdown items at the top of the sidebar. Same shape as
     *  anchors but rendered as a different visual (Mintlify spec). */
    dropdowns?: Dropdown[];
    /** Anchors shown on every page regardless of section — useful for
     *  tenant-wide links (changelog, blog, etc.). */
    global?: {
      anchors?: Anchor[];
    };
  };
  /** Page-level styling overrides. */
  styling?: {
    /** Eyebrow rendered above the page title. `breadcrumbs` shows the full
     *  navigation path; `section` only shows the parent section. */
    eyebrows?: 'breadcrumbs' | 'section';
  };
}

export interface Anchor {
  anchor: string;
  icon?: IconValue;
  hidden?: boolean;
  href?: string;
  pages?: PageEntry[];
  groups?: Group[];
}

export interface Dropdown {
  dropdown: string;
  icon?: IconValue;
  hidden?: boolean;
  href?: string;
  pages?: PageEntry[];
  groups?: Group[];
}

/** Mintlify menu item — used inside `tab.menu`. Each item is a labeled
 *  entry that holds nested groups/pages or an external href. */
export interface MenuItem {
  item: string;
  icon?: IconValue;
  description?: string;
  hidden?: boolean;
  href?: string;
  pages?: PageEntry[];
  groups?: Group[];
}

export interface Tab {
  tab: string;
  icon?: IconValue;
  hidden?: boolean;
  groups?: Group[];
  /** Mintlify-style direct pages under a tab (no group wrapper). Mixed with
   *  `groups` they render together — pages first by convention. */
  pages?: PageEntry[];
  /** Mintlify `tab.menu`: dropdown items rendered when the tab is active,
   *  letting one tab branch into multiple sub-sections without occupying
   *  more navbar real estate. */
  menu?: MenuItem[];
  /** Optional override URL — when set, the tab's navbar entry links here
   *  instead of the inferred first page. */
  href?: string;
  /** Mintlify `tab.directory`: when set, the renderer auto-renders a
   *  directory listing on root pages within this tab. */
  directory?: 'none' | 'accordion' | 'card';
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
 * Inverse of `buildPageEntryResolver` — convert a real on-disk path back to
 * the docs.json page slug. Strips the docs subdirectory + optional `content/`
 * prefix and the `.mdx`/`.md` extension. Returns null if the path doesn't
 * sit under `<docsSubdirectory>` (caller shouldn't be inserting it).
 *
 *   "content/landing.mdx", ""     → "landing"
 *   "docs/content/quickstart.mdx", "docs" → "quickstart"
 */
export function filePathToPageSlug(
  filePath: string,
  docsSubdirectory: string,
): string | null {
  const sub = docsSubdirectory.replace(/\/+$/, '');
  let p = filePath;
  if (sub) {
    if (!p.startsWith(sub + '/')) return null;
    p = p.slice(sub.length + 1);
  }
  if (p.startsWith('content/')) p = p.slice('content/'.length);
  return p.replace(/\.(mdx|md)$/, '');
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

/**
 * Walk the docs.json navigation depth-first, yielding every non-hidden,
 * non-external page entry in nav order. Order: tabs → tab.pages → tab.groups
 * → group.pages → nested groups (recursive). Used by the editor to find a
 * landing page for the no-path URL.
 *
 * Returns a generator so callers can short-circuit on the first entry whose
 * resolved file path actually exists in the repo (avoiding the resolver's
 * best-guess fallback for missing files).
 */
export function* reachablePages(config: DocsConfig | null): Generator<PageEntry> {
  if (!config) return;
  for (const tab of config.navigation?.tabs ?? []) {
    if (tab.hidden) continue;
    for (const entry of tab.pages ?? []) {
      yield* yieldReachableInEntry(entry);
    }
    for (const group of tab.groups ?? []) {
      if (group.hidden) continue;
      yield* yieldReachableInGroup(group);
    }
  }
}

function* yieldReachableInGroup(group: Group): Generator<PageEntry> {
  for (const entry of group.pages ?? []) {
    yield* yieldReachableInEntry(entry);
  }
}

function* yieldReachableInEntry(entry: PageEntry): Generator<PageEntry> {
  if (typeof entry === 'string') {
    yield entry;
    return;
  }
  if (isGroup(entry)) {
    if (entry.hidden) return;
    yield* yieldReachableInGroup(entry);
    return;
  }
  if (entry.hidden || entry.externalUrl) return;
  if (!entry.page && !entry.slug) return;
  yield entry;
}

/**
 * Yield every local page entry referenced anywhere in `navigation.tabs`,
 * including entries marked `hidden`. Used to compute the set of repo paths
 * docs.json *knows about* — anything on disk outside that set is an orphan.
 * Mirrors `reachablePages` but doesn't prune hidden branches.
 */
export function* referencedPages(config: DocsConfig | null): Generator<PageEntry> {
  if (!config) return;
  for (const tab of config.navigation?.tabs ?? []) {
    for (const entry of tab.pages ?? []) yield* yieldReferencedInEntry(entry);
    for (const group of tab.groups ?? []) yield* yieldReferencedInGroup(group);
  }
}

function* yieldReferencedInGroup(group: Group): Generator<PageEntry> {
  for (const entry of group.pages ?? []) yield* yieldReferencedInEntry(entry);
}

function* yieldReferencedInEntry(entry: PageEntry): Generator<PageEntry> {
  if (typeof entry === 'string') {
    yield entry;
    return;
  }
  if (isGroup(entry)) {
    yield* yieldReferencedInGroup(entry);
    return;
  }
  if (entry.externalUrl) return;
  if (!entry.page && !entry.slug) return;
  yield entry;
}

/**
 * First reachable page entry that satisfies an optional predicate. With no
 * predicate this returns the first reachable entry (whether or not the file
 * actually exists on disk); pass a predicate like `(e) => repoPaths.has(...)`
 * to skip entries whose resolved file isn't in the repo.
 */
export function firstReachablePage(
  config: DocsConfig | null,
  predicate?: (entry: PageEntry) => boolean,
): PageEntry | null {
  for (const entry of reachablePages(config)) {
    if (!predicate || predicate(entry)) return entry;
  }
  return null;
}
