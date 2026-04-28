/**
 * Compatibility shim. The canonical tokens now live in `@nebula-docs/theme`.
 *
 * Existing imports like:
 *   import { resolveColor } from '@site/src/lib/tokens';
 *   import type { ThemeTokens } from '@site/src/lib/tokens';
 * keep working unchanged. Migrate to `@nebula-docs/theme` directly when convenient.
 */

export type { ThemeTokens } from '@nebula-docs/theme';
export {
  mcoeDefaultTokens,
  uhcTokens,
  optumTokens,
  allThemes,
  getThemeById,
  resolveColor,
} from '@nebula-docs/theme';
