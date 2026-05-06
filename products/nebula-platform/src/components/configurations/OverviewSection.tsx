import { TextCard } from './FormCard';
import type { DocsConfig } from '@/lib/docsConfig';

export interface OverviewValues {
  name: string;
  description: string;
  favicon: string;
}

export function readOverview(config: DocsConfig): OverviewValues {
  const c = config as DocsConfig & Record<string, unknown>;
  return {
    name: stringValue(c.name) ?? '',
    description: stringValue(c.description) ?? '',
    favicon: stringValue(c.favicon) ?? '',
  };
}

export function applyOverview(
  config: DocsConfig,
  patch: Partial<OverviewValues>,
): DocsConfig {
  const next = { ...config } as DocsConfig & Record<string, unknown>;
  if (patch.name !== undefined) next.name = patch.name || undefined;
  if (patch.description !== undefined)
    next.description = patch.description || undefined;
  if (patch.favicon !== undefined)
    next.favicon = patch.favicon || undefined;
  return next;
}

interface OverviewSectionProps {
  values: OverviewValues;
  onChange: (patch: Partial<OverviewValues>) => void;
}

export function OverviewSection({ values, onChange }: OverviewSectionProps) {
  return (
    <div className="flex flex-col gap-3">
      <TextCard
        label="Docs title"
        value={values.name}
        onChange={(v) => onChange({ name: v })}
        placeholder="Site title"
      />
      <TextCard
        label="Description"
        value={values.description}
        onChange={(v) => onChange({ description: v })}
        placeholder="One-line summary used for meta tags"
      />
      <TextCard
        label="Favicon"
        value={values.favicon}
        onChange={(v) => onChange({ favicon: v })}
        placeholder="/favicon.ico"
      />
    </div>
  );
}

function stringValue(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}
