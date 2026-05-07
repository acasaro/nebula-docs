/**
 * Navigation helpers for the renderer. Mirrors the Platform's docsConfig
 * types (products/nebula-platform/src/lib/docsConfig.ts) so a docs.json
 * authored via the Platform editor renders the same way in the CLI.
 *
 * Type shapes (from the Platform):
 *   IconValue   = string | { name, library?, style? }
 *   Group       = { group, icon?, hidden?, tag?, expanded?, root?, pages? }
 *   PageObject  = { page?, slug?, sidebarTitle?, icon?, externalUrl?,
 *                   tag?, hidden?, ... }
 *   PageEntry   = string | Group | PageObject
 *
 * The renderer's sidebar walks these and the editor writes them; the
 * resolveIcon / pageSlug / pageLabel helpers below are the shared
 * vocabulary so neither side drifts.
 */

export function isGroup(entry) {
  return typeof entry === 'object' && entry !== null && 'group' in entry;
}

export function isPageObject(entry) {
  return typeof entry === 'object' && entry !== null && !('group' in entry);
}

/** Extract an icon's name + library + type from an IconValue (string or object). */
export function resolveIcon(icon) {
  if (!icon) return null;
  if (typeof icon === 'string') return { name: icon, library: 'lucide' };
  return {
    name: icon.name,
    library: icon.library || 'lucide',
    type: icon.style,
  };
}

/** Slug a PageEntry resolves to (for routing + active-state matching). */
export function pageSlug(entry) {
  if (typeof entry === 'string') return entry;
  if (isPageObject(entry)) return entry.slug || entry.page || null;
  return null;
}

/** Visible label in the sidebar — sidebarTitle wins, else the file's basename. */
export function pageLabel(entry) {
  if (typeof entry === 'string') return prettifySlug(entry);
  if (isPageObject(entry)) {
    if (entry.sidebarTitle) return entry.sidebarTitle;
    const slug = pageSlug(entry);
    return slug ? prettifySlug(slug) : '';
  }
  return '';
}

export function pageHref(entry) {
  if (isPageObject(entry) && entry.externalUrl) return entry.externalUrl;
  const slug = pageSlug(entry);
  if (!slug) return '#';
  if (slug === 'index' || slug === '/') return '/';
  return `/${slug}`;
}

export function isHidden(entry) {
  if (typeof entry === 'string') return false;
  return Boolean(entry.hidden);
}

function prettifySlug(slug) {
  const last = slug.split('/').pop() ?? slug;
  return last
    .split('-')
    .map((s) => (s.length ? s[0].toUpperCase() + s.slice(1) : s))
    .join(' ');
}

/** First reachable page slug in a group. Honors `group.root` (Mintlify
 *  pattern: when set, the group title navigates to that page) — root wins
 *  over walking children, since the author has explicitly designated the
 *  group's landing. Falls through to the first child if root is unset. */
export function firstPageInGroup(group) {
  if (typeof group.root === 'string' && group.root.length > 0) {
    return group.root;
  }
  for (const page of group.pages ?? []) {
    if (isHidden(page)) continue;
    if (typeof page === 'string') return page;
    if (page && typeof page === 'object') {
      if ('group' in page) {
        const nested = firstPageInGroup(page);
        if (nested) return nested;
      } else if (page.slug || page.page) {
        return page.slug || page.page;
      }
    }
  }
  return null;
}

/** First reachable page slug in a tab. Walks `tab.pages` first (Mintlify lets
 *  a tab carry direct pages alongside groups), then falls through to
 *  `tab.groups`. */
export function firstPageInTab(tab) {
  for (const page of tab.pages ?? []) {
    if (isHidden(page)) continue;
    if (typeof page === 'string') return page;
    if (page && typeof page === 'object') {
      if ('group' in page) {
        const nested = firstPageInGroup(page);
        if (nested) return nested;
      } else if (page.slug || page.page) {
        return page.slug || page.page;
      }
    }
  }
  for (const group of tab.groups ?? []) {
    if (isHidden(group)) continue;
    const first = firstPageInGroup(group);
    if (first) return first;
  }
  return null;
}

/** Whether a tab contains the given slug anywhere in its tree. Walks
 *  `tab.pages` and `tab.groups` (and recurses into nested groups via
 *  `groupContainsSlug`). */
export function tabContainsSlug(tab, slug) {
  if (!slug) return false;
  for (const page of tab.pages ?? []) {
    if (typeof page === 'string') {
      if (page === slug) return true;
    } else if (page && typeof page === 'object') {
      if ('group' in page && groupContainsSlug(page, slug)) return true;
      if ((page.slug || page.page) === slug) return true;
    }
  }
  for (const group of tab.groups ?? []) {
    if (groupContainsSlug(group, slug)) return true;
  }
  return false;
}

function groupContainsSlug(group, slug) {
  for (const page of group.pages ?? []) {
    if (typeof page === 'string') {
      if (page === slug) return true;
    } else if (page && typeof page === 'object') {
      if ('group' in page && groupContainsSlug(page, slug)) return true;
      if ((page.slug || page.page) === slug) return true;
    }
  }
  return false;
}

/**
 * Active tab index for a given slug. Falls back to 0 when no tab claims the
 * page (e.g. /index when index isn't in any tab's tree). Tenants who want a
 * different default for the home page can set `tab.default: true` (Phase 3).
 */
export function activeTabIndex(tabs, slug) {
  const i = tabs.findIndex((t) => tabContainsSlug(t, slug));
  return i === -1 ? 0 : i;
}

/** href for a tab — first page in tree, or explicit `tab.href` if set. */
export function tabHref(tab) {
  if (tab.href) return tab.href;
  const slug = firstPageInTab(tab);
  if (!slug) return '/';
  if (slug === 'index') return '/';
  return `/${slug}`;
}
