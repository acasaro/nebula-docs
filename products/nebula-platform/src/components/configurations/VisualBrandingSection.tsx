import { ColorCard, SelectCard, TextCard, ToggleCard } from './FormCard';
import type { DocsConfig } from '@/lib/docsConfig';
import type { ThemeConfig } from '@/lib/themeConfig';

export interface VisualBrandingValues {
  themeBase: string;
  switcherEnabled: boolean;
  logoLight: string;
  logoDark: string;
  logoHref: string;
}

export interface ThemeColorValues {
  primary: string;
  light: string;
  dark: string;
}

export interface CodeBlockThemeValues {
  light: string;
  dark: string;
}

const THEME_OPTIONS = [
  { value: 'mcoe-default', label: 'MCOE default' },
  { value: 'optum', label: 'Optum' },
  { value: 'uhc', label: 'UHC' },
] as const;

// Sentinel used in the SelectCard `value` slot to represent "no override —
// fall back to the renderer's built-in default." Radix Select rejects
// empty-string values, so we round-trip through this token at the form
// edge and translate back to `undefined` in apply*. Any value matching
// this sentinel is treated as "unset" everywhere downstream.
const CODE_BLOCK_THEME_DEFAULT = '__default__';

// Curated subset of Shiki's bundled themes. Each entry's `value` is the
// exact Shiki theme ID consumed by `<CodeBlock lightTheme={...} />` and by
// the CLI's astro.config.mjs at build time.
const SHIKI_LIGHT_OPTIONS = [
  { value: CODE_BLOCK_THEME_DEFAULT, label: 'Default (GitHub Light)' },
  { value: 'github-light', label: 'GitHub Light' },
  { value: 'github-light-default', label: 'GitHub Light (default)' },
  { value: 'light-plus', label: 'VS Light+' },
  { value: 'vitesse-light', label: 'Vitesse Light' },
  { value: 'min-light', label: 'Min Light' },
  { value: 'one-light', label: 'One Light' },
  { value: 'catppuccin-latte', label: 'Catppuccin Latte' },
  { value: 'material-theme-lighter', label: 'Material Lighter' },
  { value: 'slack-ochin', label: 'Slack Ochin' },
  { value: 'snazzy-light', label: 'Snazzy Light' },
] as const;

const SHIKI_DARK_OPTIONS = [
  { value: CODE_BLOCK_THEME_DEFAULT, label: 'Default (GitHub Dark)' },
  { value: 'github-dark', label: 'GitHub Dark' },
  { value: 'github-dark-default', label: 'GitHub Dark (default)' },
  { value: 'github-dark-dimmed', label: 'GitHub Dark Dimmed' },
  { value: 'dark-plus', label: 'VS Dark+' },
  { value: 'vitesse-dark', label: 'Vitesse Dark' },
  { value: 'dracula', label: 'Dracula' },
  { value: 'monokai', label: 'Monokai' },
  { value: 'one-dark-pro', label: 'One Dark Pro' },
  { value: 'nord', label: 'Nord' },
  { value: 'material-theme-ocean', label: 'Material Ocean' },
  { value: 'catppuccin-mocha', label: 'Catppuccin Mocha' },
  { value: 'night-owl', label: 'Night Owl' },
] as const;

export function readVisualBranding(config: DocsConfig): VisualBrandingValues {
  const c = config as DocsConfig & {
    theme?: { base?: string; switcherEnabled?: boolean };
    logo?: { light?: string; dark?: string; href?: string };
  };
  return {
    themeBase: c.theme?.base ?? 'mcoe-default',
    switcherEnabled: c.theme?.switcherEnabled ?? false,
    logoLight: c.logo?.light ?? '',
    logoDark: c.logo?.dark ?? '',
    logoHref: c.logo?.href ?? '',
  };
}

export function applyVisualBranding(
  config: DocsConfig,
  patch: Partial<VisualBrandingValues>,
): DocsConfig {
  const next = JSON.parse(JSON.stringify(config)) as DocsConfig & {
    theme?: { base?: string; switcherEnabled?: boolean; extends?: string };
    logo?: { light?: string; dark?: string; href?: string };
  };

  if (patch.themeBase !== undefined || patch.switcherEnabled !== undefined) {
    const theme = next.theme ?? {};
    if (patch.themeBase !== undefined) theme.base = patch.themeBase;
    if (patch.switcherEnabled !== undefined)
      theme.switcherEnabled = patch.switcherEnabled;
    next.theme = theme;
  }

  if (
    patch.logoLight !== undefined ||
    patch.logoDark !== undefined ||
    patch.logoHref !== undefined
  ) {
    const logo = next.logo ?? {};
    if (patch.logoLight !== undefined)
      logo.light = patch.logoLight || undefined;
    if (patch.logoDark !== undefined) logo.dark = patch.logoDark || undefined;
    if (patch.logoHref !== undefined) logo.href = patch.logoHref || undefined;
    next.logo = logo;
  }

  return next;
}

export function readThemeColors(
  themeConfig: ThemeConfig | null,
): ThemeColorValues {
  const tokens = themeConfig?.tokens ?? {};
  return {
    primary: stringValue(tokens.brandPrimary) ?? '',
    light: stringValue(tokens.brandPrimaryLight) ?? '',
    dark: stringValue(tokens.brandPrimaryDark) ?? '',
  };
}

export function applyThemeColors(
  themeConfig: ThemeConfig,
  patch: Partial<ThemeColorValues>,
): ThemeConfig {
  const next: ThemeConfig = {
    ...themeConfig,
    tokens: { ...(themeConfig.tokens ?? {}) },
  };
  const tokens = next.tokens!;
  if (patch.primary !== undefined)
    tokens.brandPrimary = patch.primary || undefined;
  if (patch.light !== undefined)
    tokens.brandPrimaryLight = patch.light || undefined;
  if (patch.dark !== undefined)
    tokens.brandPrimaryDark = patch.dark || undefined;
  return next;
}

export function readCodeBlockThemes(
  themeConfig: ThemeConfig | null,
): CodeBlockThemeValues {
  // Translate "no override" to the sentinel so the Select stays valid
  // (Radix rejects empty strings).
  return {
    light: themeConfig?.codeBlock?.light ?? CODE_BLOCK_THEME_DEFAULT,
    dark: themeConfig?.codeBlock?.dark ?? CODE_BLOCK_THEME_DEFAULT,
  };
}

export function applyCodeBlockThemes(
  themeConfig: ThemeConfig,
  patch: Partial<CodeBlockThemeValues>,
): ThemeConfig {
  const next: ThemeConfig = {
    ...themeConfig,
    codeBlock: { ...(themeConfig.codeBlock ?? {}) },
  };
  const cb = next.codeBlock!;
  // The default sentinel (and the empty string, defensively) means
  // "fall back to the renderer default" — drop the key so theme.json
  // doesn't carry an empty override forward.
  const isUnset = (v: string | undefined) =>
    v === undefined || v === '' || v === CODE_BLOCK_THEME_DEFAULT;
  if (patch.light !== undefined) {
    if (isUnset(patch.light)) delete cb.light;
    else cb.light = patch.light;
  }
  if (patch.dark !== undefined) {
    if (isUnset(patch.dark)) delete cb.dark;
    else cb.dark = patch.dark;
  }
  // If both values are unset, drop the codeBlock object entirely so the
  // serialized theme.json stays clean.
  if (cb.light === undefined && cb.dark === undefined) {
    delete next.codeBlock;
  }
  return next;
}

interface VisualBrandingSectionProps {
  values: VisualBrandingValues;
  onChange: (patch: Partial<VisualBrandingValues>) => void;
  colors: ThemeColorValues;
  onColorChange: (patch: Partial<ThemeColorValues>) => void;
  codeBlockThemes: CodeBlockThemeValues;
  onCodeBlockThemeChange: (patch: Partial<CodeBlockThemeValues>) => void;
}

export function VisualBrandingSection({
  values,
  onChange,
  colors,
  onColorChange,
  codeBlockThemes,
  onCodeBlockThemeChange,
}: VisualBrandingSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <SelectCard
        label="Theme"
        value={values.themeBase}
        onChange={(v) => onChange({ themeBase: v })}
        options={THEME_OPTIONS}
      />
      <ColorCard
        label="Primary color"
        value={colors.primary}
        onChange={(v) => onColorChange({ primary: v })}
        placeholder="#5469d4"
      />
      <ColorCard
        label="Light"
        value={colors.light}
        onChange={(v) => onColorChange({ light: v })}
        placeholder="#7d89e0"
      />
      <ColorCard
        label="Dark"
        value={colors.dark}
        onChange={(v) => onColorChange({ dark: v })}
        placeholder="#3d4eac"
      />
      <SelectCard
        label="Code block — light theme"
        value={codeBlockThemes.light}
        onChange={(v) => onCodeBlockThemeChange({ light: v })}
        options={SHIKI_LIGHT_OPTIONS}
      />
      <SelectCard
        label="Code block — dark theme"
        value={codeBlockThemes.dark}
        onChange={(v) => onCodeBlockThemeChange({ dark: v })}
        options={SHIKI_DARK_OPTIONS}
      />
      <TextCard
        label="Light logo"
        value={values.logoLight}
        onChange={(v) => onChange({ logoLight: v })}
        placeholder="/logo/light.svg"
      />
      <TextCard
        label="Dark logo"
        value={values.logoDark}
        onChange={(v) => onChange({ logoDark: v })}
        placeholder="/logo/dark.svg"
      />
      <TextCard
        label="Logo link"
        type="url"
        value={values.logoHref}
        onChange={(v) => onChange({ logoHref: v })}
        placeholder="/"
      />
      <ToggleCard
        label="Theme toggle"
        checked={values.switcherEnabled}
        onChange={(v) => onChange({ switcherEnabled: v })}
        labels={['Active', 'Disabled']}
      />
    </div>
  );
}

function stringValue(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}
