import { resolve } from 'node:path';
import { CLI_ROOT } from '../paths.mjs';
import { prepareAstroEnv } from '../prepareAstro.mjs';

/**
 * Normalize the `--base` flag to a leading-slash, no-trailing-slash form so
 * the output is identical regardless of how the caller spells it
 * (`previews/42`, `/previews/42`, `/previews/42/` all produce `/previews/42`).
 * Astro accepts either trailing-slash form internally, but the rendered HTML's
 * `<a href>` paths are constructed via `withBase()` (see runtime/lib/nav.mjs)
 * which assumes the no-trailing-slash form to avoid double slashes.
 */
function normalizeBase(input) {
  if (!input || input === true) return null;
  let s = String(input).trim();
  if (!s) return null;
  if (!s.startsWith('/')) s = `/${s}`;
  s = s.replace(/\/+$/, '');
  return s === '' ? '/' : s;
}

export async function runBuild({ tenant, flags }) {
  await prepareAstroEnv({ tenant });
  const { build } = await import('astro');

  const base = normalizeBase(flags.base);
  if (base) {
    process.env.NEBULA_BASE = base;
  }

  const outDir = resolve(tenant, 'dist');
  process.env.NEBULA_OUT_DIR = outDir;

  process.stdout.write(
    `nebula build: ${tenant} -> ${outDir}${base ? ` (base ${base})` : ''}\n`,
  );
  await build({ root: CLI_ROOT });
}
