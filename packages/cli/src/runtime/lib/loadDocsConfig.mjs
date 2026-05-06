import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Read the tenant's docs.json once and cache for the lifetime of the dev /
 * build process. The file is invariant during a single Astro run — restart
 * to pick up edits. (Phase 3 may add HMR for docs.json.)
 */
let cached;

export function loadDocsConfig() {
  if (cached) return cached;
  const tenantRoot = process.env.NEBULA_TENANT_ROOT;
  if (!tenantRoot) {
    throw new Error('NEBULA_TENANT_ROOT not set — run through the nebula-docs CLI.');
  }
  const text = readFileSync(resolve(tenantRoot, 'docs.json'), 'utf8');
  cached = JSON.parse(text);
  return cached;
}
