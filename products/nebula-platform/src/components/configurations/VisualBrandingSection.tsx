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

const THEME_OPTIONS = [
  { value: 'mcoe-default', label: 'MCOE default' },
  { value: 'optum', label: 'Optum' },
  { value: 'uhc', label: 'UHC' },
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

interface VisualBrandingSectionProps {
  values: VisualBrandingValues;
  onChange: (patch: Partial<VisualBrandingValues>) => void;
  colors: ThemeColorValues;
  onColorChange: (patch: Partial<ThemeColorValues>) => void;
}

export function VisualBrandingSection({
  values,
  onChange,
  colors,
  onColorChange,
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
