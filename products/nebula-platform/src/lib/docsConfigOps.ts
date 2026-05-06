import {
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
  pagePath: number[];
}

export type ResolvedEntry = ResolvedTab | ResolvedGroup | ResolvedPage;

export function findEntry(
  config: DocsConfig,
  key: string,
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

  // page — walk every group's pages looking for one whose file path matches.
  for (let ti = 0; ti < tabs.length; ti++) {
    const tab = tabs[ti]!;
    const groups = tab.groups ?? [];
    for (let gi = 0; gi < groups.length; gi++) {
      const path: number[] = [gi];
      const found = walkPages(groups[gi]!, path, parsed.filePath);
      if (found) {
        return {
          kind: 'page',
          page: found.entry,
          pageObject: isPageObject(found.entry) ? found.entry : null,
          filePath: parsed.filePath,
          tabIndex: ti,
          pagePath: found.path,
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
): { entry: PageEntry; path: number[] } | null {
  const pages = group.pages ?? [];
  for (let i = 0; i < pages.length; i++) {
    const entry = pages[i]!;
    if (isGroup(entry)) {
      const found = walkPages(entry, [...groupPath, i], targetFilePath);
      if (found) return found;
      continue;
    }
    const fp = pageEntryToFilePath(entry);
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
): DocsConfig {
  const resolved = findEntry(config, key);
  if (!resolved) return config;
  return mutateAt(config, resolved, () => replacer(resolved));
}

/** Return a new config with the given key's entry removed. */
export function deleteEntry(config: DocsConfig, key: string): DocsConfig {
  const resolved = findEntry(config, key);
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
