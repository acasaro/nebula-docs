/**
 * Globals — typography, spacing, radii, shadows, body text colors.
 * These never change per theme. Light/dark variants live under darkOverrides.
 *
 * Mirrored from the Stripe Sail design system.
 */
export const globalTokens = {
    // Typography
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Helvetica Neue", "Ubuntu", sans-serif',
    fontFamilyMono: '"Menlo", "Consolas", monospace',
    fontSizeXs: '11px',
    fontSizeSm: '12px',
    fontSizeBase: '14px',
    fontSizeMd: '16px',
    fontSizeLg: '20px',
    fontSizeXl: '24px',
    fontSize2xl: '28px',
    fontSize3xl: '32px',
    fontWeightRegular: '400',
    fontWeightMedium: '500',
    fontWeightBold: '700',
    // Spacing
    space1: '2px',
    space2: '4px',
    space3: '8px',
    space4: '12px',
    space5: '16px',
    space6: '20px',
    space7: '24px',
    space8: '32px',
    space9: '48px',
    space10: '64px',
    space11: '80px',
    // Radius
    radiusSm: '3px',
    radius: '4px',
    radiusMd: '6px',
    // Shadows — Stripe Sail
    shadowXs: '0 2px 5px 0 rgba(60,66,87,0.08), 0 1px 1px 0 rgba(0,0,0,0.12)',
    shadowSm: '0 2px 5px 0 rgba(60,66,87,0.08), 0 1px 1px 0 rgba(0,0,0,0.12)',
    shadowMd: '0 7px 14px 0 rgba(60,66,87,0.08), 0 3px 6px 0 rgba(0,0,0,0.12)',
    shadowLg: '0 15px 35px 0 rgba(60,66,87,0.08), 0 5px 15px 0 rgba(0,0,0,0.12)',
    shadowFocus: '0 0 0 4px rgba(77,183,232,0.28)',
    // Body and heading text colors — global, NOT theme-specific
    textPrimary: '#3c4257', // sail-color-gray-700
    textSecondary: '#697386', // sail-color-gray-500
    textInverse: '#ffffff',
    textHeading: '#1a1f36', // sail-color-gray-900
    // Surface globals (not in any theme's ThemeTokens)
    bgDeepest: '#ffffff',
    borderNav: '#e3e8ee',
    brandDisplay: '#5469d4', // SSR fallback; runtime-overridden per theme
    // Misc
    heroGradientGray: 'linear-gradient(135deg, #f7fafc 0%, #e3e8ee 40%, #d5dce6 100%)',
    // Dark mode overrides — applied when data-theme="dark"
    darkOverrides: {
        textPrimary: '#e6e8ed',
        textSecondary: '#8b91a0',
        textHeading: '#e6e8ed',
        textInverse: '#1c1e26',
        bgDeepest: '#0e1018',
    },
};
//# sourceMappingURL=globals.js.map