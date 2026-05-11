import type { GlobalTokens, ThemeTokens } from './types';
/**
 * Generate the full SSR-fallback tokens.css from a base theme + globals.
 *
 * Output structure:
 *   :root {
 *     <theme vars>           — light values from `theme`
 *     <globals>              — typography/spacing/etc.
 *   }
 *   [data-theme="dark"] {
 *     <theme dark surfaces>  — bgPrimary, borderDefault, etc. from theme.darkMode
 *     <global dark overrides>— text colors etc. from globals.darkOverrides
 *   }
 *
 * Theme.darkMode order before globals.darkOverrides so global text-color
 * overrides win on key collisions (matches the runtime composition order
 * the Platform's McoeThemeProvider uses).
 */
export declare function generateTokensCss(theme: ThemeTokens, globals: GlobalTokens): string;
//# sourceMappingURL=cssGen.d.ts.map