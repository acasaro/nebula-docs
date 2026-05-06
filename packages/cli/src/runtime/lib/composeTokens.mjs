import {
  generateTokensCss,
  getThemeById,
  globalTokens,
} from '@nebula-docs/theme';

/**
 * Compose the CSS variable layer for a tenant.
 *
 *   globalTokens                   (frozen, every theme)
 *     + base theme tokens          (mcoe-default | uhc | optum | <id>)
 *     + theme.json overrides       (deep-merged on top of base)
 *     ──────────────────────────────────────────────────────────────
 *     → :root vars (light)
 *     → [data-theme="dark"] vars   (global dark overrides only for now)
 *
 * Theme-specific dark overrides (e.g. uhc dark mode) are applied at runtime
 * by a future theme switcher island; matches packages/theme's split.
 */
export async function composeTokensCss({ baseId, overrides }) {
  const base = getThemeById(baseId ?? 'mcoe-default');

  const baseTokens = overrides?.tokens
    ? deepMerge(base, normalizeOverrideShape(overrides.tokens))
    : base;

  return generateTokensCss(baseTokens, globalTokens);
}

/**
 * theme.json's `tokens` object is the same shape as ThemeTokens, with an
 * optional nested `darkMode` block. This is a no-op pass-through today but
 * is the right place to apply any future shape coercion (e.g. CSS-color
 * normalization, JSON Patch ops).
 */
function normalizeOverrideShape(tokens) {
  return tokens;
}

function deepMerge(a, b) {
  if (a === null || typeof a !== 'object') return b;
  if (b === null || typeof b !== 'object') return b;
  const out = { ...a };
  for (const k of Object.keys(b)) {
    out[k] = deepMerge(a[k], b[k]);
  }
  return out;
}
