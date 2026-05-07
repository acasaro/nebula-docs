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

  // Surface the tenant's Shiki theme picks to astro.config.mjs via env
  // vars. Both are optional — astro.config falls back to the renderer's
  // defaults (github-light / github-dark) when unset. Driven by the
  // editor's Visual Branding > "Code block — light/dark theme" selects.
  const cbLight = themeOverrides?.codeBlock?.light;
  const cbDark = themeOverrides?.codeBlock?.dark;
  if (typeof cbLight === 'string' && cbLight)
    process.env.NEBULA_SHIKI_LIGHT = cbLight;
  if (typeof cbDark === 'string' && cbDark)
    process.env.NEBULA_SHIKI_DARK = cbDark;

  const baseId = docs.theme?.base ?? themeOverrides?.extends ?? 'mcoe-default';
  const css = await composeTokensCss({ baseId, overrides: themeOverrides });

  const generatedDir = resolve(CLI_ROOT, '.nebula');
  mkdirSync(generatedDir, { recursive: true });
  writeFileSync(resolve(generatedDir, 'tokens.css'), css);
}
