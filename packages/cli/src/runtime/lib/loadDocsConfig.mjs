import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';

/**
 * Read the tenant's docs.json. Re-read on every page render so dev-server
 * edits take effect without restart. The cost is one fs read per route per
 * render — negligible for a docs site, and build emits each page once.
 *
 * After parsing, the docs config is passed through `reconcileNavigation`,
 * which appends any MDX file under `content/` that isn't referenced in
 * `navigation.tabs` to a synthesized "Other" group at the end of the first
 * tab. This keeps hand-dropped pages discoverable without forcing the
 * author to also edit docs.json.
 */
export function loadDocsConfig() {
  const tenantRoot = process.env.NEBULA_TENANT_ROOT;
  if (!tenantRoot) {
    throw new Error('NEBULA_TENANT_ROOT not set — run through the nebula CLI.');
  }
  const text = readFileSync(resolve(tenantRoot, 'docs.json'), 'utf8');
  const docs = JSON.parse(text);
  return reconcileNavigation(docs, tenantRoot);
}

/**
 * Walk `content/` for `*.mdx` files (excluding `snippets/**` and `index`),
 * subtract the slugs already referenced anywhere in `navigation.tabs`, and
 * append any leftovers to a synthesized "Other" group at the end of the
 * first tab. Returns a NEW docs object — does not mutate the input.
 */
export function reconcileNavigation(docs, tenantRoot) {
  const fileSlugs = collectContentSlugs(resolve(tenantRoot, 'content'));
  const navSlugs = new Set();
  const tabs = docs.navigation?.tabs ?? [];
  for (const tab of tabs) collectNavSlugs(tab, navSlugs);

  // Drop the home page (reached via the logo, not the sidebar) and anything
  // already linked from somewhere in nav.
  const orphans = fileSlugs
    .filter((slug) => slug !== 'index' && !navSlugs.has(slug))
    .sort();

  if (orphans.length === 0 || tabs.length === 0) return docs;

  const firstTab = tabs[0];
  const otherGroup = { group: 'Other', pages: orphans };
  const nextTabs = tabs.map((tab, i) =>
    i === 0
      ? { ...tab, groups: [...(firstTab.groups ?? []), otherGroup] }
      : tab,
  );
  return {
    ...docs,
    navigation: { ...docs.navigation, tabs: nextTabs },
  };
}

function collectContentSlugs(contentRoot) {
  let entries;
  try {
    entries = readdirSync(contentRoot, { withFileTypes: true, recursive: true });
  } catch {
    return [];
  }
  const slugs = [];
  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.mdx')) continue;
    const parent = entry.parentPath ?? entry.path ?? contentRoot;
    const abs = join(parent, entry.name);
    const rel = relative(contentRoot, abs);
    if (rel.split(sep)[0] === 'snippets') continue;
    slugs.push(rel.replace(/\.mdx$/, '').split(sep).join('/'));
  }
  return slugs;
}

function collectNavSlugs(node, out) {
  if (!node || typeof node !== 'object') return;
  if (Array.isArray(node)) {
    for (const item of node) collectNavSlugs(item, out);
    return;
  }
  if (typeof node.page === 'string') out.add(node.page);
  if (typeof node.slug === 'string' && !node.externalUrl) out.add(node.slug);
  if (Array.isArray(node.pages)) {
    for (const p of node.pages) {
      if (typeof p === 'string') out.add(p);
      else collectNavSlugs(p, out);
    }
  }
  if (Array.isArray(node.groups)) {
    for (const g of node.groups) collectNavSlugs(g, out);
  }
}

/**
 * Walk the navigation tree to find the deepest group containing a given slug.
 * Returns the group's display name (used as the page-header eyebrow), or
 * undefined if the slug isn't referenced (e.g. the home page).
 */
export function findGroupForSlug(docs, slug) {
  if (!slug) return undefined;
  const tabs = docs.navigation?.tabs ?? [];
  for (const tab of tabs) {
    for (const group of tab.groups ?? []) {
      const match = walk(group, slug);
      if (match) return match;
    }
  }
  return undefined;
}

function walk(group, slug) {
  let deepest;
  for (const page of group.pages ?? []) {
    if (typeof page === 'string') {
      if (page === slug) deepest = group.group;
    } else if (page && typeof page === 'object') {
      if ('group' in page) {
        const nested = walk(page, slug);
        if (nested) deepest = nested;
      } else if ((page.slug || page.page) === slug) {
        deepest = group.group;
      }
    }
  }
  return deepest;
}

/**
 * Walk the navigation tree and return the chain of ancestor labels leading
 * to a slug — Tab → Group → SubGroup → … (excluding the slug's own page
 * label, which the page header renders as the title). Used by
 * `styling.eyebrows: "breadcrumbs"`. Each entry has a `label` and, where
 * applicable, an `href` (the tab's first page or the group's `root`).
 */
export function findBreadcrumbsForSlug(docs, slug) {
  if (!slug) return [];
  const tabs = docs.navigation?.tabs ?? [];
  for (const tab of tabs) {
    const trail = walkBreadcrumbs(tab.groups ?? [], slug, []);
    if (trail) return [{ label: tab.tab }, ...trail];
    // Tab direct pages
    for (const page of tab.pages ?? []) {
      if (typeof page === 'string' && page === slug) return [{ label: tab.tab }];
      if (page && typeof page === 'object' && !('group' in page) && (page.slug || page.page) === slug) {
        return [{ label: tab.tab }];
      }
    }
  }
  return [];
}

function walkBreadcrumbs(groups, slug, parents) {
  for (const group of groups) {
    const here = [...parents, { label: group.group, href: group.root ? `/${group.root}` : undefined }];
    for (const page of group.pages ?? []) {
      if (typeof page === 'string') {
        if (page === slug) return here;
      } else if (page && typeof page === 'object') {
        if ('group' in page) {
          const nested = walkBreadcrumbs([page], slug, here);
          if (nested) return nested;
        } else if ((page.slug || page.page) === slug) {
          return here;
        }
      }
    }
  }
  return null;
}
