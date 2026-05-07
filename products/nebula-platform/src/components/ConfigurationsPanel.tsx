import { CircleDot, Image as ImageIcon, PanelTop, Rows3 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import {
  FooterSection,
  HeaderSection,
  OverviewSection,
  VisualBrandingSection,
  applyCodeBlockThemes,
  applyFooter,
  applyHeader,
  applyOverview,
  applyVisualBranding,
  applyThemeColors,
  readCodeBlockThemes,
  readFooter,
  readHeader,
  readOverview,
  readThemeColors,
  readVisualBranding,
  type CodeBlockThemeValues,
  type FooterValues,
  type HeaderValues,
  type OverviewValues,
  type ThemeColorValues,
  type VisualBrandingValues,
} from '@/components/configurations';
import type { DocsConfig } from '@/lib/docsConfig';
import type { ThemeConfig } from '@/lib/themeConfig';
import { cn } from '@/lib/utils';

type SectionKey = 'overview' | 'visual' | 'header' | 'footer';

const SECTIONS: ReadonlyArray<{
  key: SectionKey;
  label: string;
  icon: LucideIcon;
}> = [
  { key: 'overview', label: 'Overview', icon: CircleDot },
  { key: 'visual', label: 'Visual Branding', icon: ImageIcon },
  { key: 'header', label: 'Header & Topbar', icon: PanelTop },
  { key: 'footer', label: 'Footer', icon: Rows3 },
];

interface ConfigurationsPanelProps {
  config: DocsConfig | null;
  onConfigChange: (updater: (config: DocsConfig) => DocsConfig) => void;
  themeConfig: ThemeConfig | null;
  onThemeChange: (updater: (config: ThemeConfig) => ThemeConfig) => void;
}

/**
 * Site-wide settings page. Renders in place of the file viewer when the
 * Configurations toggle is active. Two panes: the section rail on the left
 * and the active section's form on the right. All edits flow through
 * `onConfigChange`, which mutates `docs.json` in the file map — the same
 * path every other settings form uses.
 */
export function ConfigurationsPanel({
  config,
  onConfigChange,
  themeConfig,
  onThemeChange,
}: ConfigurationsPanelProps) {
  const [active, setActive] = useState<SectionKey>('overview');

  return (
    <div className="flex flex-1 overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-5xl gap-8 px-8 py-8">
        <nav className="flex w-52 shrink-0 flex-col gap-0.5">
          {SECTIONS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActive(key)}
              className={cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                active === key
                  ? 'bg-accent font-semibold text-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>
        <div className="min-w-0 flex-1">
          {config ? (
            <SectionBody
              active={active}
              config={config}
              onConfigChange={onConfigChange}
              themeConfig={themeConfig}
              onThemeChange={onThemeChange}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              No <code>docs.json</code> in this branch yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionBody({
  active,
  config,
  onConfigChange,
  themeConfig,
  onThemeChange,
}: {
  active: SectionKey;
  config: DocsConfig;
  onConfigChange: (updater: (config: DocsConfig) => DocsConfig) => void;
  themeConfig: ThemeConfig | null;
  onThemeChange: (updater: (config: ThemeConfig) => ThemeConfig) => void;
}) {
  if (active === 'overview') {
    const values = readOverview(config);
    const onChange = (patch: Partial<OverviewValues>) =>
      onConfigChange((c) => applyOverview(c, patch));
    return <OverviewSection values={values} onChange={onChange} />;
  }
  if (active === 'visual') {
    const values = readVisualBranding(config);
    const onChange = (patch: Partial<VisualBrandingValues>) =>
      onConfigChange((c) => applyVisualBranding(c, patch));
    const colors = readThemeColors(themeConfig);
    const onColorChange = (patch: Partial<ThemeColorValues>) =>
      onThemeChange((c) => applyThemeColors(c, patch));
    const codeBlockThemes = readCodeBlockThemes(themeConfig);
    const onCodeBlockThemeChange = (patch: Partial<CodeBlockThemeValues>) =>
      onThemeChange((c) => applyCodeBlockThemes(c, patch));
    return (
      <VisualBrandingSection
        values={values}
        onChange={onChange}
        colors={colors}
        onColorChange={onColorChange}
        codeBlockThemes={codeBlockThemes}
        onCodeBlockThemeChange={onCodeBlockThemeChange}
      />
    );
  }
  if (active === 'header') {
    const values = readHeader(config);
    const onChange = (patch: Partial<HeaderValues>) =>
      onConfigChange((c) => applyHeader(c, patch));
    return <HeaderSection values={values} onChange={onChange} />;
  }
  const values = readFooter(config);
  const onChange = (patch: Partial<FooterValues>) =>
    onConfigChange((c) => applyFooter(c, patch));
  return <FooterSection values={values} onChange={onChange} />;
}
