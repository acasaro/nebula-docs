import type { GlobalTokens, ThemeTokens } from './types';

const PREFIX = '--mcoe';

/**
 * Convert camelCase TS keys to kebab-case CSS-var suffixes.
 *   brandPrimary  → brand-primary
 *   fontSize2xl   → font-size-2xl
 *   space1        → space-1
 *   heroOrb1      → hero-orb-1
 */
function kebab(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/([a-zA-Z])([0-9])/g, '$1-$2')
    .toLowerCase();
}

function emit(record: Record<string, string>, indent = '  '): string {
  return Object.entries(record)
    .map(([k, v]) => `${indent}${PREFIX}-${kebab(k)}: ${v};`)
    .join('\n');
}

/** Flatten ThemeTokens (skip metadata + nested darkMode). */
function flatTheme(t: ThemeTokens): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(t)) {
    if (k === 'darkMode' || k === 'id' || k === 'label') continue;
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

/** Flatten GlobalTokens (skip nested darkOverrides). */
function flatGlobals(g: GlobalTokens): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(g)) {
    if (k === 'darkOverrides') continue;
    if (typeof v === 'string') out[k] = v;
  }
  return out;
}

/**
 * Generate the full SSR-fallback tokens.css from a base theme + globals.
 *
 * Output structure:
 *   :root {
 *     <theme vars>           — light values from `theme`
 *     <globals>              — typography/spacing/etc.
 *   }
 *   [data-theme="dark"] {
 *     <global dark overrides>
 *   }
 *
 * Theme-specific dark overrides (e.g., uhc dark mode) are applied at runtime
 * by McoeThemeProvider — not in this static CSS.
 */
export function generateTokensCss(
  theme: ThemeTokens,
  globals: GlobalTokens
): string {
  const root = { ...flatTheme(theme), ...flatGlobals(globals) };
  return [
    '/* AUTO-GENERATED from @mcoe/theme — do not edit by hand. */',
    '/* Source: packages/theme/src/themes + globals.ts */',
    '',
    ':root {',
    emit(root),
    '}',
    '',
    '[data-theme="dark"] {',
    emit(globals.darkOverrides),
    '}',
    '',
  ].join('\n');
}
