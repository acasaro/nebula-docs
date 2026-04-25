/**
 * MCoE theme contracts.
 *
 * Two categories of tokens:
 *   - ThemeTokens — change per theme (mcoe-default / uhc / optum). Brand colors,
 *     surfaces, semantic colors, link, code-block syntax theme.
 *   - GlobalTokens — never theme-specific. Stripe Sail typography, spacing,
 *     radii, shadows, and the body/heading text colors that stay constant
 *     across themes (with a small light/dark override set).
 */

export interface ThemeTokens {
  id: string;
  label: string;

  // Brand — drives primary buttons, active states, sidebar accent
  brandPrimary: string;
  brandPrimaryDark: string;
  brandPrimaryLight: string;
  brandPrimaryOnDark: string; // readable variant for dark backgrounds
  brandAccent: string;
  brandAccentDark: string;

  // Surfaces — page bg, offset/canvas bg, inverse bg
  bgPrimary: string;
  bgSecondary: string; // offset / sidebar / navbar bg
  bgTertiary: string;  // canvas / card bg
  bgInverse: string;   // inverse surface (e.g. footer, dark banners)

  // Link color — unique per theme
  textLink: string;

  // Borders
  borderDefault: string;
  borderMuted: string;

  // Semantic — alert variants, badges, callouts
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  info: string;
  infoLight: string;

  // Hero section
  heroGradient: string;
  heroOrb1: string;
  heroOrb2: string;

  // Code block syntax theme
  codeBackground: string;
  codeTitleBackground: string;
  codeTitleText: string;
  codePlainText: string;
  codeKeyword: string;
  codeString: string;
  codeFunction: string;
  codeNumber: string;
  codeComment: string;
  codePunctuation: string;
  codeSymbol: string;

  // Dark mode overrides — applied when data-theme="dark".
  // Only keys that differ from the light defaults above need to be set.
  darkMode: {
    bgPrimary?: string;
    bgSecondary?: string;
    bgTertiary?: string;
    bgInverse?: string;
    textLink?: string;
    borderDefault?: string;
    borderMuted?: string;
    brandPrimaryOnDark?: string;
    success?: string;
    successLight?: string;
    warning?: string;
    warningLight?: string;
    error?: string;
    errorLight?: string;
    info?: string;
    infoLight?: string;
    heroGradient?: string;
  };
}

export interface GlobalTokens {
  // Typography
  fontFamily: string;
  fontFamilyMono: string;
  fontSizeXs: string;
  fontSizeSm: string;
  fontSizeBase: string;
  fontSizeMd: string;
  fontSizeLg: string;
  fontSizeXl: string;
  fontSize2xl: string;
  fontSize3xl: string;
  fontWeightRegular: string;
  fontWeightMedium: string;
  fontWeightBold: string;

  // Spacing — Stripe Sail scale
  space1: string;
  space2: string;
  space3: string;
  space4: string;
  space5: string;
  space6: string;
  space7: string;
  space8: string;
  space9: string;
  space10: string;
  space11: string;

  // Radius
  radiusSm: string;
  radius: string;
  radiusMd: string;

  // Shadows
  shadowXs: string;
  shadowSm: string;
  shadowMd: string;
  shadowLg: string;
  shadowFocus: string;

  // Body / heading text colors — never theme-specific
  textPrimary: string;
  textSecondary: string;
  textInverse: string;
  textHeading: string;

  // Surface globals not covered by ThemeTokens
  bgDeepest: string;
  borderNav: string;
  brandDisplay: string; // SSR fallback; runtime overridden by McoeThemeProvider

  // Misc
  heroGradientGray: string;

  // Dark mode overrides for globals (applied when data-theme="dark")
  darkOverrides: {
    textPrimary: string;
    textSecondary: string;
    textHeading: string;
    textInverse: string;
    bgDeepest: string;
  };
}
