/**
 * MCoE Theme Tokens
 *
 * Architecture:
 *   - Global Stripe styles (typography, heading colors, spacing) live in CSS and
 *     are NEVER overridden by themes.
 *   - Each theme owns: brand colors, link color, backgrounds, and semantic colors
 *     (success/warning/error/info). These are the only things that change per theme.
 *   - darkMode provides overrides applied when Docusaurus switches to dark mode.
 *     Modern Tech is already dark, so its darkMode is a no-op.
 *   - mcoe-default is the Stripe-neutral palette — no strong brand color.
 *     It is the SSR fallback (tokens.css) and a selectable theme.
 */

export interface ThemeTokens {
  id: string;
  label: string;

  // Brand — drives primary buttons, active states, sidebar accent
  brandPrimary: string;
  brandPrimaryDark: string;
  brandPrimaryLight: string;
  brandPrimaryOnDark: string; // readable version for dark backgrounds
  brandAccent: string;
  brandAccentDark: string;

  // Surfaces — page bg, offset/canvas bg, inverse bg
  bgPrimary: string;
  bgSecondary: string;  // offset / sidebar / navbar bg
  bgTertiary: string;   // canvas / card bg
  bgInverse: string;    // inverse surface (e.g. footer, dark banners)

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

  // Dark mode overrides — applied when data-theme="dark"
  // Only needs values that differ from the light defaults above.
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

// ─── Shared dark mode neutral surfaces ───────────────────────────────────────
// UHC, Optum, and mcoe-default share the same dark neutral surfaces.
// Modern Tech has its own dark values baked into its light defaults.
const sharedDarkSurfaces = {
  bgPrimary: '#1c1e26',
  bgSecondary: '#14161e',
  bgTertiary: '#252836',
  bgInverse: '#f0f2f5',
  borderDefault: '#353847',
  borderMuted: '#282b3a',
};

const sharedDarkSemantic = {
  success: '#3fbf68',
  successLight: '#1a3326',
  warning: '#f5a623',
  warningLight: '#332514',
  error: '#f06272',
  errorLight: '#331820',
  info: '#5a9cf5',
  infoLight: '#162238',
};

// ─── mcoe-default ─────────────────────────────────────────────────────────────
// Stripe-neutral palette. No strong brand color. Used as:
//   1. SSR fallback (mirrored in tokens.css)
//   2. A selectable "no brand" theme
export const mcoeDefaultTokens: ThemeTokens = {
  id: 'mcoe-default',
  label: 'Default',

  brandPrimary: '#5469d4',       // sail-color-blue-500
  brandPrimaryDark: '#3d4eac',   // sail-color-blue-600
  brandPrimaryLight: '#7d89e0',  // sail-color-blue-400
  brandPrimaryOnDark: '#84a9ff',
  brandAccent: '#3abff8',
  brandAccentDark: '#0ea5e9',

  bgPrimary: '#ffffff',
  bgSecondary: '#f7fafc',        // sail-color-gray-50
  bgTertiary: '#e3e8ee',         // sail-color-gray-100
  bgInverse: '#1a1f36',          // sail-color-gray-900

  textLink: '#5469d4',           // sail-color-blue-500

  borderDefault: '#e3e8ee',      // sail-color-gray-100
  borderMuted: '#c1c9d2',        // sail-color-gray-200

  success: '#09825d',            // sail-color-green-500
  successLight: '#efffed',       // sail-color-green-50
  warning: '#bb5504',            // sail-color-yellow-500
  warningLight: '#fcf9e9',       // sail-color-yellow-50
  error: '#cd3d64',              // sail-color-red-500
  errorLight: '#fff8f5',         // sail-color-red-50
  info: '#5469d4',               // sail-color-blue-500
  infoLight: '#f5fbff',          // sail-color-blue-50

  heroGradient: 'linear-gradient(135deg, #3d4eac 0%, #2d3a8c 40%, #1a2457 100%)',
  heroOrb1: 'rgba(84, 105, 212, 0.25)',
  heroOrb2: 'rgba(58, 191, 248, 0.15)',

  codeBackground: '#212d63',
  codeTitleBackground: '#161f4a',
  codeTitleText: '#a0aecf',
  codePlainText: '#cdd5e0',
  codeKeyword: '#84a9ff',
  codeString: '#84d896',
  codeFunction: '#d2a8ff',
  codeNumber: '#84d896',
  codeComment: '#6b7498',
  codePunctuation: '#8892b0',
  codeSymbol: '#fbb5b2',

  darkMode: {
    ...sharedDarkSurfaces,
    ...sharedDarkSemantic,
    textLink: '#84a9ff',
    brandPrimaryOnDark: '#84a9ff',
    heroGradient: 'linear-gradient(135deg, #252836 0%, #1c1e26 100%)',
  },
};

// ─── UHC ──────────────────────────────────────────────────────────────────────
export const uhcTokens: ThemeTokens = {
  id: 'uhc',
  label: 'UHC',

  brandPrimary: '#002677',       // Abyss core.color.brand.100
  brandPrimaryDark: '#00184D',   // Abyss core.color.brand.120
  brandPrimaryLight: '#0C55B8',  // Abyss core.color.brand.70
  brandPrimaryOnDark: '#5A9CF5',
  brandAccent: '#00BED5',        // Abyss core.color.pacific.100
  brandAccentDark: '#149E8F',    // Abyss core.color.turquoise.100

  bgPrimary: '#ffffff',
  bgSecondary: '#f7fafc',
  bgTertiary: '#e3e8ee',
  bgInverse: '#1a1f36',

  textLink: '#0C55B8',           // UHC brand blue

  borderDefault: '#e3e8ee',
  borderMuted: '#c1c9d2',

  success: '#09825d',
  successLight: '#efffed',
  warning: '#bb5504',
  warningLight: '#fcf9e9',
  error: '#cd3d64',
  errorLight: '#fff8f5',
  info: '#0C55B8',               // UHC blue for info
  infoLight: '#e8f0fb',

  heroGradient: 'linear-gradient(135deg, #002677 0%, #00184D 40%, #000f3d 100%)',
  heroOrb1: 'rgba(0, 190, 213, 0.25)',
  heroOrb2: 'rgba(12, 85, 184, 0.15)',

  codeBackground: '#0d1b3e',
  codeTitleBackground: '#071030',
  codeTitleText: '#8aabcc',
  codePlainText: '#cdd5e0',
  codeKeyword: '#5A9CF5',
  codeString: '#7ecbca',
  codeFunction: '#00BED5',
  codeNumber: '#79c0ff',
  codeComment: '#5a6a8a',
  codePunctuation: '#8892b0',
  codeSymbol: '#79c0ff',

  darkMode: {
    ...sharedDarkSurfaces,
    ...sharedDarkSemantic,
    textLink: '#5A9CF5',
    brandPrimaryOnDark: '#5A9CF5',
    info: '#5A9CF5',
    infoLight: '#162238',
    heroGradient: 'linear-gradient(135deg, #252836 0%, #1c1e26 100%)',
  },
};

// ─── Optum ────────────────────────────────────────────────────────────────────
export const optumTokens: ThemeTokens = {
  id: 'optum',
  label: 'Optum',

  brandPrimary: '#FF612B',       // Abyss core.color.orange.100
  brandPrimaryDark: '#C24E14',
  brandPrimaryLight: '#FF8F6B',
  brandPrimaryOnDark: '#FF8F6B',
  brandAccent: '#0C55B8',        // Abyss core.color.brand.70
  brandAccentDark: '#002677',

  bgPrimary: '#ffffff',
  bgSecondary: '#f7fafc',
  bgTertiary: '#e3e8ee',
  bgInverse: '#1a1f36',

  textLink: '#0C55B8',           // Optum uses blue for links, not orange

  borderDefault: '#e3e8ee',
  borderMuted: '#c1c9d2',

  success: '#09825d',
  successLight: '#efffed',
  warning: '#FF612B',            // Optum orange doubles as warning
  warningLight: '#fff2ec',
  error: '#cd3d64',
  errorLight: '#fff8f5',
  info: '#0C55B8',
  infoLight: '#e8f0fb',

  heroGradient: 'linear-gradient(135deg, #FF612B 0%, #D14900 40%, #8B3000 100%)',
  heroOrb1: 'rgba(12, 85, 184, 0.25)',
  heroOrb2: 'rgba(255, 143, 107, 0.15)',

  codeBackground: '#2b2623',
  codeTitleBackground: '#1a1410',
  codeTitleText: '#b8a898',
  codePlainText: '#e8ddd6',
  codeKeyword: '#FF8F6B',
  codeString: '#ffd080',
  codeFunction: '#FF612B',
  codeNumber: '#79c0ff',
  codeComment: '#7a6a5a',
  codePunctuation: '#9a8878',
  codeSymbol: '#ffd080',

  darkMode: {
    ...sharedDarkSurfaces,
    ...sharedDarkSemantic,
    textLink: '#FF8F6B',
    brandPrimaryOnDark: '#FF8F6B',
    heroGradient: 'linear-gradient(135deg, #252836 0%, #1c1e26 100%)',
  },
};

// ─── Registry ─────────────────────────────────────────────────────────────────
export const allThemes: ThemeTokens[] = [
  mcoeDefaultTokens,
  uhcTokens,
  optumTokens,
];

export function getThemeById(id: string): ThemeTokens {
  return allThemes.find((t) => t.id === id) || mcoeDefaultTokens;
}

/**
 * Resolve a color value from a simple token name, hex, or any CSS color.
 * Components can pass "info", "warning", etc. instead of raw CSS vars.
 */
const tokenColorMap: Record<string, string> = {
  info: 'var(--mcoe-info)',
  'info-light': 'var(--mcoe-info-light)',
  warning: 'var(--mcoe-warning)',
  'warning-light': 'var(--mcoe-warning-light)',
  success: 'var(--mcoe-success)',
  'success-light': 'var(--mcoe-success-light)',
  error: 'var(--mcoe-error)',
  'error-light': 'var(--mcoe-error-light)',
  primary: 'var(--mcoe-brand-primary)',
  'primary-dark': 'var(--mcoe-brand-primary-dark)',
  'primary-light': 'var(--mcoe-brand-primary-light)',
  accent: 'var(--mcoe-brand-accent)',
  'accent-dark': 'var(--mcoe-brand-accent-dark)',
  'text-link': 'var(--mcoe-text-link)',
  border: 'var(--mcoe-border-default)',
  'border-muted': 'var(--mcoe-border-muted)',
};

export function resolveColor(value: string): string {
  return tokenColorMap[value] ?? value;
}
