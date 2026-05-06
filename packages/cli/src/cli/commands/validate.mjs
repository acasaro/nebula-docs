import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve, join } from 'node:path';

/**
 * Phase 0 validate: shape-check docs.json + theme.json, ensure every page
 * referenced from `navigation` has a matching MDX file under `content/`.
 * Schema-driven validation (Zod / Ajv) lands in Phase 3 with the published
 * JSON Schemas.
 */
export async function runValidate({ tenant }) {
  const errors = [];

  const docsJsonPath = resolve(tenant, 'docs.json');
  let docs;
  try {
    docs = JSON.parse(readFileSync(docsJsonPath, 'utf8'));
  } catch (e) {
    errors.push(`docs.json: ${e.message}`);
    fail(errors);
  }

  if (!docs.name) errors.push('docs.json: missing required field "name"');
  if (!docs.navigation?.tabs) errors.push('docs.json: missing navigation.tabs');

  const themePath = resolve(tenant, 'theme.json');
  if (existsSync(themePath)) {
    try {
      JSON.parse(readFileSync(themePath, 'utf8'));
    } catch (e) {
      errors.push(`theme.json: ${e.message}`);
    }
  }

  const contentDir = resolve(tenant, 'content');
  if (!existsSync(contentDir)) {
    errors.push('content/: directory missing');
    fail(errors);
  }

  for (const slug of collectPageRefs(docs.navigation?.tabs ?? [])) {
    const candidate = join(contentDir, `${slug}.mdx`);
    if (!existsSync(candidate)) {
      errors.push(`navigation references missing page: ${slug}.mdx`);
    }
  }

  // Walk content/ for any orphan files (not referenced + not under snippets/)
  for (const file of walk(contentDir)) {
    if (!file.endsWith('.mdx')) continue;
    const rel = file.slice(contentDir.length + 1).replace(/\.mdx$/, '');
    if (rel.startsWith('snippets/') || rel === 'index') continue;
    if (!isReferenced(docs.navigation?.tabs ?? [], rel)) {
      // Soft warning, not an error.
      process.stderr.write(`warning: ${rel}.mdx is not referenced in docs.json navigation\n`);
    }
  }

  if (errors.length) fail(errors);
  process.stdout.write(`docs.json validates: ${docs.name}\n`);
}

function* collectPageRefs(tabs) {
  for (const tab of tabs) {
    for (const group of tab.groups ?? []) {
      yield* groupPages(group);
    }
  }
}

function* groupPages(group) {
  for (const page of group.pages ?? []) {
    if (typeof page === 'string') yield page;
    else if (page && typeof page === 'object' && 'group' in page) yield* groupPages(page);
  }
}

function isReferenced(tabs, slug) {
  for (const ref of collectPageRefs(tabs)) {
    if (ref === slug) return true;
  }
  return false;
}

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

function fail(errors) {
  for (const e of errors) process.stderr.write(`error: ${e}\n`);
  process.exit(1);
}
