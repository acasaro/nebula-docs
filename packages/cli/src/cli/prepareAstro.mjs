import { mkdirSync, writeFileSync, existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { CLI_ROOT } from './paths.mjs';
import { composeTokensCss } from '../runtime/lib/composeTokens.mjs';

/**
 * Run before any Astro entry point. Sets the env vars that the Astro config
 * + content collection rely on, and writes the composed tokens.css to
 * `packages/cli/.nebula/tokens.css` so the global stylesheet can `@import` it.
 */
export async function prepareAstroEnv({ tenant }) {
  process.env.NEBULA_TENANT_ROOT = tenant;

  const docsJsonPath = resolve(tenant, 'docs.json');
  const docs = JSON.parse(readFileSync(docsJsonPath, 'utf8'));
  process.env.NEBULA_TENANT_NAME = String(docs.name ?? 'Nebula Docs');

  const themeJsonPath = resolve(tenant, 'theme.json');
  const themeOverrides = existsSync(themeJsonPath)
    ? JSON.parse(readFileSync(themeJsonPath, 'utf8'))
    : null;

  const baseId = docs.theme?.base ?? themeOverrides?.extends ?? 'mcoe-default';
  const css = await composeTokensCss({ baseId, overrides: themeOverrides });

  const generatedDir = resolve(CLI_ROOT, '.nebula');
  mkdirSync(generatedDir, { recursive: true });
  writeFileSync(resolve(generatedDir, 'tokens.css'), css);
}
