import {
  buildPageEntryResolver,
  isGroup,
  isPageObject,
  pageEntryToFilePath,
  type DocsConfig,
  type Group,
  type PageEntry,
  type PageObject,
  type Tab,
} from '@/lib/docsConfig';

/**
 * Repo path set + docs subdirectory needed to translate a docs.json entry
 * to its real MDX file path. Pass-through for any helper that has to
 * compare a settings key's `filePath` against an entry — the comparison
 * has to happen in the same namespace the key was minted in (NavTree
 * builds keys with `buildPageEntryResolver`, so we must too). Optional so
 * legacy callers that don't have the context still work; without it the
 * comparison falls back to the raw, content-relative path which only
 * matches root-shaped repos with no docs subdirectory.
 */
export interface ResolveContext {
  repoPaths: ReadonlySet<string>;
  docsSubdirectory: string;
}

/**
 * NavTree encodes settings keys as `<kind>:<key>`:
 *   - `tab:<tabName>` — by tab name (assumes uniqueness within the doc)
 *   - `group:tab<tabIdx>/<groupIdx>/<groupName>(/p<i>)*` — index-based path
 *     down through nested groups
 *   - `page:<filePath>` — stable file path keys pages
 *
 * These helpers parse the key, resolve the live entry inside a `docs.json`
 * config, and return enough address info to mutate the entry in-place.
 */

export type ParsedKey =
  | { kind: 'tab'; tabName: string }
  | { kind: 'group'; tabIndex: number; groupPath: number[] }
  | { kind: 'page'; filePath: string };

export function parseSettingsKey(raw: string): ParsedKey | null {
  const colon = raw.indexOf(':');
  if (colon < 0) return null;
  const kind = raw.slice(0, colon);
  const value = raw.slice(colon + 1);
  if (kind === 'tab') return { kind: 'tab', tabName: value };
  if (kind === 'page') return { kind: 'page', filePath: value };
  if (kind === 'group') {
    const parts = value.split('/');
    if (parts.length < 2) return null;
    const tabPart = parts[0];
    if (!tabPart || !tabPart.startsWith('tab')) return null;
    const tabIndex = Number(tabPart.slice(3));
    if (!Number.isFinite(tabIndex)) return null;
    const top = Number(parts[1]);
    if (!Number.isFinite(top)) return null;
    const groupPath = [top];
    // Tokens after the second slot: optionally a group-name label, then any
    // number of `p<n>` nested-group indices. The label is decorative only.
    for (let i = 2; i < parts.length; i++) {
      const seg = parts[i] ?? '';
      if (seg.startsWith('p')) {
        const n = Number(seg.slice(1));
        if (Number.isFinite(n)) groupPath.push(n);
      }
    }
    return { kind: 'group', tabIndex, groupPath };
  }
  return null;
}

export interface ResolvedTab {
  kind: 'tab';
  tab: Tab;
  tabIndex: number;
}

export interface ResolvedGroup {
  kind: 'group';
  group: Group;
  tabIndex: number;
  groupPath: number[];
}

export interface ResolvedPage {
  kind: 'page';
  page: PageEntry;
  pageObject: PageObject | null;
  filePath: string;
  tabIndex: number;
  /** When `inTabDirect` is false: `[groupIndex, ...nestedGroupIndices, pageIndex]`
   *  walks `tab.groups[g0].pages[g1]…pages[pageIndex]`.
   *  When `inTabDirect` is true: `[pageIndex]` indexes directly into
   *  `tab.pages[pageIndex]`. */
  pagePath: number[];
  /** True when the page lives directly under `tab.pages` (the Mintlify-style
   *  ungrouped-page slot the Tab `+` adds into). False for grouped pages. */
  inTabDirect: boolean;
}

export type ResolvedEntry = ResolvedTab | ResolvedGroup | ResolvedPage;

export function findEntry(
  config: DocsConfig,
  key: string,
  resolveCtx?: ResolveContext,
): ResolvedEntry | null {
  const parsed = parseSettingsKey(key);
  if (!parsed) return null;
  const tabs = config.navigation?.tabs ?? [];

  if (parsed.kind === 'tab') {
    const tabIndex = tabs.findIndex((t) => t.tab === parsed.tabName);
    if (tabIndex < 0) return null;
    return { kind: 'tab', tab: tabs[tabIndex]!, tabIndex };
  }

  if (parsed.kind === 'group') {
    const tab = tabs[parsed.tabIndex];
    if (!tab) return null;
    let group: Group | undefined = tab.groups?.[parsed.groupPath[0]!];
    if (!group) return null;
    for (let i = 1; i < parsed.groupPath.length; i++) {
      const child: PageEntry | undefined = group.pages?.[parsed.groupPath[i]!];
      if (!child || !isGroup(child)) return null;
      group = child;
    }
    return {
      kind: 'group',
      group,
      tabIndex: parsed.tabIndex,
      groupPath: parsed.groupPath,
    };
  }

  const resolveEntryPath = resolveCtx
    ? buildPageEntryResolver(resolveCtx.repoPaths, resolveCtx.docsSubdirectory)
    : pageEntryToFilePath;

  // page — check direct-under-tab pages first, then walk every group's pages.
  for (let ti = 0; ti < tabs.length; ti++) {
    const tab = tabs[ti]!;
    const directPages = tab.pages ?? [];
    for (let pi = 0; pi < directPages.length; pi++) {
      const entry = directPages[pi]!;
      if (isGroup(entry)) continue; // tab.pages should hold pages only
      const fp = resolveEntryPath(entry);
      if (fp === parsed.filePath) {
        return {
          kind: 'page',
          page: entry,
          pageObject: isPageObject(entry) ? entry : null,
          filePath: parsed.filePath,
          tabIndex: ti,
          pagePath: [pi],
          inTabDirect: true,
        };
      }
    }
    const groups = tab.groups ?? [];
    for (let gi = 0; gi < groups.length; gi++) {
      const path: number[] = [gi];
      const found = walkPages(groups[gi]!, path, parsed.filePath, resolveEntryPath);
      if (found) {
        return {
          kind: 'page',
          page: found.entry,
          pageObject: isPageObject(found.entry) ? found.entry : null,
          filePath: parsed.filePath,
          tabIndex: ti,
          pagePath: found.path,
          inTabDirect: false,
        };
      }
    }
  }
  return null;
}

function walkPages(
  group: Group,
  groupPath: number[],
  targetFilePath: string,
  resolveEntryPath: (entry: PageEntry) => string | null,
): { entry: PageEntry; path: number[] } | null {
  const pages = group.pages ?? [];
  for (let i = 0; i < pages.length; i++) {
    const entry = pages[i]!;
    if (isGroup(entry)) {
      const found = walkPages(entry, [...groupPath, i], targetFilePath, resolveEntryPath);
      if (found) return found;
      continue;
    }
    const fp = resolveEntryPath(entry);
    if (fp === targetFilePath) {
      return { entry, path: [...groupPath, i] };
    }
  }
  return null;
}

/** Return a new config with the given key's entry replaced by `replacer`. */
export function updateEntry(
  config: DocsConfig,
  key: string,
  replacer: (entry: ResolvedEntry) => unknown,
  resolveCtx?: ResolveContext,
): DocsConfig {
  const resolved = findEntry(config, key, resolveCtx);
  if (!resolved) return config;
  return mutateAt(config, resolved, () => replacer(resolved));
}

/** Return a new config with the given key's entry removed. */
export function deleteEntry(
  config: DocsConfig,
  key: string,
  resolveCtx?: ResolveContext,
): DocsConfig {
  const resolved = findEntry(config, key, resolveCtx);
  if (!resolved) return config;
  return mutateAt(config, resolved, () => undefined, { remove: true });
}

function mutateAt(
  config: DocsConfig,
  resolved: ResolvedEntry,
  replacement: () => unknown,
  opts: { remove?: boolean } = {},
): DocsConfig {
  const next: DocsConfig = JSON.parse(JSON.stringify(config));
  const tabs = next.navigation?.tabs ?? [];
  if (!next.navigation) next.navigation = { tabs };

  if (resolved.kind === 'tab') {
    if (opts.remove) {
      tabs.splice(resolved.tabIndex, 1);
    } else {
      tabs[resolved.tabIndex] = replacement() as Tab;
    }
    return next;
  }

  if (resolved.kind === 'group') {
    const tab = tabs[resolved.tabIndex];
    if (!tab) return next;
    const groups = tab.groups ?? [];
    if (!tab.groups) tab.groups = groups;
    const path = resolved.groupPath;
    if (path.length === 1) {
      if (opts.remove) {
        groups.splice(path[0]!, 1);
      } else {
        groups[path[0]!] = replacement() as Group;
      }
      return next;
    }
    let parent = groups[path[0]!];
    for (let i = 1; i < path.length - 1; i++) {
      const child = parent?.pages?.[path[i]!];
      if (!child || !isGroup(child)) return next;
      parent = child;
    }
    if (!parent) return next;
    const pages = parent.pages ?? [];
    if (!parent.pages) parent.pages = pages;
    const idx = path[path.length - 1]!;
    if (opts.remove) {
      pages.splice(idx, 1);
    } else {
      pages[idx] = replacement() as PageEntry;
    }
    return next;
  }

  // page
  const tab = tabs[resolved.tabIndex];
  if (!tab) return next;

  // Direct-under-tab pages: pagePath = [pageIndex] indexes tab.pages.
  if (resolved.inTabDirect) {
    const pages = tab.pages ?? [];
    if (!tab.pages) tab.pages = pages;
    const idx = resolved.pagePath[0]!;
    if (opts.remove) {
      pages.splice(idx, 1);
    } else {
      pages[idx] = replacement() as PageEntry;
    }
    return next;
  }

  const groups = tab.groups ?? [];
  let group = groups[resolved.pagePath[0]!];
  for (let i = 1; i < resolved.pagePath.length - 1; i++) {
    const child = group?.pages?.[resolved.pagePath[i]!];
    if (!child || !isGroup(child)) return next;
    group = child;
  }
  if (!group) return next;
  const pages = group.pages ?? [];
  if (!group.pages) group.pages = pages;
  const idx = resolved.pagePath[resolved.pagePath.length - 1]!;
  if (opts.remove) {
    pages.splice(idx, 1);
  } else {
    pages[idx] = replacement() as PageEntry;
  }
  return next;
}

/**
 * Append a page or group entry directly under a tab. For pages, pushes onto
 * `tab.pages`; for groups, pushes onto `tab.groups`. Pre-tab-shaped entries
 * stay in `tab.groups`; new direct-pages land in `tab.pages` so they render
 * above their grouped siblings.
 */
export function appendToTab(
  config: DocsConfig,
  parentKey: string,
  entry: PageEntry,
): DocsConfig {
  const resolved = findEntry(config, parentKey);
  if (!resolved || resolved.kind !== 'tab') return config;
  const next: DocsConfig = JSON.parse(JSON.stringify(config));
  const tabs = next.navigation?.tabs ?? [];
  const tab = tabs[resolved.tabIndex];
  if (!tab) return next;
  if (isGroup(entry)) {
    if (!tab.groups) tab.groups = [];
    tab.groups.push(entry);
  } else {
    if (!tab.pages) tab.pages = [];
    tab.pages.push(entry);
  }
  return next;
}

/**
 * Append a new tab to `navigation.tabs`. The tab name is the only required
 * field — groups and other settings are added later via the tab's settings
 * panel. Idempotent on no-op (returns the same config reference if the tabs
 * shape couldn't be found).
 */
export function appendTab(config: DocsConfig, tab: Tab): DocsConfig {
  const next: DocsConfig = JSON.parse(JSON.stringify(config));
  if (!next.navigation) next.navigation = { tabs: [] };
  if (!next.navigation.tabs) next.navigation.tabs = [];
  next.navigation.tabs.push(tab);
  return next;
}

/**
 * Append a new entry. For pages and groups, append at the end of the named
 * group's `pages` array; for groups (top-level), append at the named tab's
 * `groups` array.
 */
export function appendToGroup(
  config: DocsConfig,
  parentKey: string,
  entry: PageEntry,
): DocsConfig {
  const resolved = findEntry(config, parentKey);
  if (!resolved || resolved.kind !== 'group') return config;
  const next: DocsConfig = JSON.parse(JSON.stringify(config));
  const tabs = next.navigation?.tabs ?? [];
  const tab = tabs[resolved.tabIndex];
  if (!tab) return next;
  let group = tab.groups?.[resolved.groupPath[0]!];
  for (let i = 1; i < resolved.groupPath.length; i++) {
    const child = group?.pages?.[resolved.groupPath[i]!];
    if (!child || !isGroup(child)) return next;
    group = child;
  }
  if (!group) return next;
  const pages = group.pages ?? [];
  if (!group.pages) group.pages = pages;
  pages.push(entry);
  return next;
}

/**
 * Address of an array slot in docs.json — a `where to put it` for an insert.
 * `tab-pages` and `tab-groups` index directly into the named tab; `group-pages`
 * walks `tab.groups[gp[0]].pages[gp[1]].pages…` like the `findEntry` resolver.
 */
export type DocsInsertAddress =
  | { kind: 'tab-pages'; tabIndex: number; index: number }
  | { kind: 'tab-groups'; tabIndex: number; index: number }
  | { kind: 'group-pages'; tabIndex: number; groupPath: number[]; index: number };

/**
 * Read off the parent array slot of any nav row so we can insert above/below.
 * Used by drag-and-drop: target row → its address → insert source nearby.
 */
export function addressOfEntry(resolved: ResolvedEntry): DocsInsertAddress | null {
  if (resolved.kind === 'tab') return null; // tabs aren't drop targets
  if (resolved.kind === 'group') {
    return {
      kind: 'tab-groups',
      tabIndex: resolved.tabIndex,
      index: resolved.groupPath[0]!,
    };
  }
  if (resolved.inTabDirect) {
    return {
      kind: 'tab-pages',
      tabIndex: resolved.tabIndex,
      index: resolved.pagePath[0]!,
    };
  }
  return {
    kind: 'group-pages',
    tabIndex: resolved.tabIndex,
    groupPath: resolved.pagePath.slice(0, -1),
    index: resolved.pagePath[resolved.pagePath.length - 1]!,
  };
}

function pagesArrayAt(
  config: DocsConfig,
  address: DocsInsertAddress,
): PageEntry[] | Group[] | null {
  const tabs = config.navigation?.tabs ?? [];
  const tab = tabs[address.tabIndex];
  if (!tab) return null;
  if (address.kind === 'tab-pages') {
    if (!tab.pages) tab.pages = [];
    return tab.pages;
  }
  if (address.kind === 'tab-groups') {
    if (!tab.groups) tab.groups = [];
    return tab.groups;
  }
  let group = tab.groups?.[address.groupPath[0]!];
  for (let i = 1; i < address.groupPath.length; i++) {
    const child = group?.pages?.[address.groupPath[i]!];
    if (!child || !isGroup(child)) return null;
    group = child;
  }
  if (!group) return null;
  if (!group.pages) group.pages = [];
  return group.pages;
}

/** Insert `entry` at `address`. Returns a new config; original untouched. */
export function insertEntryAt(
  config: DocsConfig,
  address: DocsInsertAddress,
  entry: PageEntry,
): DocsConfig {
  const next: DocsConfig = JSON.parse(JSON.stringify(config));
  if (!next.navigation) next.navigation = { tabs: [] };
  const arr = pagesArrayAt(next, address);
  if (!arr) return next;
  // tab-groups is a Group[] — silently skip non-Group entries to avoid
  // corrupting the schema. Callers should validate before calling.
  if (address.kind === 'tab-groups' && !isGroup(entry)) return next;
  const idx = Math.max(0, Math.min(address.index, arr.length));
  (arr as PageEntry[]).splice(idx, 0, entry);
  return next;
}

/**
 * Remove the entry at `sourceKey` and insert it at `dest`. Handles the
 * same-array index shift internally (if you remove index 2 and ask to insert
 * at index 5 in the *same* array, the actual insert lands at index 4). Used
 * by drag-and-drop reorder.
 */
export function moveEntryToAddress(
  config: DocsConfig,
  sourceKey: string,
  dest: DocsInsertAddress,
  resolveCtx?: ResolveContext,
): DocsConfig {
  const resolved = findEntry(config, sourceKey, resolveCtx);
  if (!resolved || resolved.kind === 'tab') return config;
  // Snapshot the entry before deletion so we can re-insert it.
  const entry: PageEntry =
    resolved.kind === 'group' ? resolved.group : resolved.page;
  const sourceAddr = addressOfEntry(resolved);
  if (!sourceAddr) return config;

  // Index shift: if source and destination point at the same array AND the
  // source slot sits before the destination, the post-removal indices shift
  // down by one.
  let destIndex = dest.index;
  const sameArray =
    sourceAddr.kind === dest.kind &&
    sourceAddr.tabIndex === dest.tabIndex &&
    (dest.kind !== 'group-pages' ||
      JSON.stringify((sourceAddr as Extract<DocsInsertAddress, { kind: 'group-pages' }>).groupPath) ===
        JSON.stringify((dest as Extract<DocsInsertAddress, { kind: 'group-pages' }>).groupPath));
  if (sameArray && sourceAddr.index < destIndex) destIndex -= 1;

  const removed = deleteEntry(config, sourceKey, resolveCtx);
  return insertEntryAt(removed, { ...dest, index: destIndex }, entry);
}
