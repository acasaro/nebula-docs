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
