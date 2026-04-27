/**
 * Compatibility shim. The canonical tokens now live in `@nebula/theme`.
 *
 * Existing imports like:
 *   import { resolveColor } from '@site/src/lib/tokens';
 *   import type { ThemeTokens } from '@site/src/lib/tokens';
 * keep working unchanged. Migrate to `@nebula/theme` directly when convenient.
 */

export type { ThemeTokens } from '@nebula/theme';
export {
  mcoeDefaultTokens,
  uhcTokens,
  optumTokens,
  allThemes,
  getThemeById,
  resolveColor,
} from '@nebula/theme';
