import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Read the tenant's docs.json. Re-read on every page render so dev-server
 * edits take effect without restart. The cost is one fs read per route per
 * render — negligible for a docs site, and build emits each page once.
 */
export function loadDocsConfig() {
  const tenantRoot = process.env.NEBULA_TENANT_ROOT;
  if (!tenantRoot) {
    throw new Error('NEBULA_TENANT_ROOT not set — run through the nebula-docs CLI.');
  }
  const text = readFileSync(resolve(tenantRoot, 'docs.json'), 'utf8');
  return JSON.parse(text);
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
