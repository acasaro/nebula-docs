import { Plus, Trash2 } from 'lucide-react';
import { FormCard, TextCard } from './FormCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DocsConfig } from '@/lib/docsConfig';

export interface FooterLinkValue {
  label: string;
  href: string;
}

export interface FooterColumnValue {
  label: string;
  links: FooterLinkValue[];
}

export interface FooterValues {
  columns: FooterColumnValue[];
  copyright: string;
}

interface FooterShape {
  columns?: Array<{
    label?: string;
    links?: Array<{ label?: string; href?: string }>;
  }>;
  copyright?: string;
}

export function readFooter(config: DocsConfig): FooterValues {
  const footer =
    (config as DocsConfig & { footer?: FooterShape }).footer ?? {};
  return {
    columns: (footer.columns ?? []).map((c) => ({
      label: c.label ?? '',
      links: (c.links ?? []).map((l) => ({
        label: l.label ?? '',
        href: l.href ?? '',
      })),
    })),
    copyright: footer.copyright ?? '',
  };
}

export function applyFooter(
  config: DocsConfig,
  patch: Partial<FooterValues>,
): DocsConfig {
  const next = JSON.parse(JSON.stringify(config)) as DocsConfig & {
    footer?: FooterShape;
  };
  const footer: FooterShape = next.footer ?? {};

  if (patch.columns !== undefined) {
    if (patch.columns.length === 0) {
      delete footer.columns;
    } else {
      footer.columns = patch.columns.map((c) => ({
        label: c.label,
        links: c.links.map((l) => ({ label: l.label, href: l.href })),
      }));
    }
  }

  if (patch.copyright !== undefined) {
    if (patch.copyright.trim()) {
      footer.copyright = patch.copyright;
    } else {
      delete footer.copyright;
    }
  }

  if (Object.keys(footer).length === 0) {
    delete next.footer;
  } else {
    next.footer = footer;
  }
  return next;
}

interface FooterSectionProps {
  values: FooterValues;
  onChange: (patch: Partial<FooterValues>) => void;
}

export function FooterSection({ values, onChange }: FooterSectionProps) {
  const updateColumn = (
    colIndex: number,
    patch: Partial<FooterColumnValue>,
  ) => {
    onChange({
      columns: values.columns.map((c, i) =>
        i === colIndex ? { ...c, ...patch } : c,
      ),
    });
  };

  const addColumn = () => {
    onChange({
      columns: [...values.columns, { label: 'New column', links: [] }],
    });
  };

  const removeColumn = (colIndex: number) => {
    onChange({ columns: values.columns.filter((_, i) => i !== colIndex) });
  };

  const updateLink = (
    colIndex: number,
    linkIndex: number,
    patch: Partial<FooterLinkValue>,
  ) => {
    const col = values.columns[colIndex];
    if (!col) return;
    const links = col.links.map((l, i) =>
      i === linkIndex ? { ...l, ...patch } : l,
    );
    updateColumn(colIndex, { links });
  };

  const addLink = (colIndex: number) => {
    const col = values.columns[colIndex];
    if (!col) return;
    updateColumn(colIndex, {
      links: [...col.links, { label: '', href: '' }],
    });
  };

  const removeLink = (colIndex: number, linkIndex: number) => {
    const col = values.columns[colIndex];
    if (!col) return;
    updateColumn(colIndex, {
      links: col.links.filter((_, i) => i !== linkIndex),
    });
  };

  return (
    <div className="flex flex-col gap-3">
      {values.columns.map((col, ci) => (
        <FormCard
          key={ci}
          label={`Footer column ${ci + 1}`}
          action={
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" onClick={() => addLink(ci)}>
                <Plus className="size-3.5" /> Add
              </Button>
              <button
                type="button"
                aria-label={`Remove column ${ci + 1}`}
                onClick={() => removeColumn(ci)}
                className="flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          }
        >
          <Input
            className="bg-background"
            value={col.label}
            placeholder="Column heading"
            onChange={(e) => updateColumn(ci, { label: e.target.value })}
          />
          {col.links.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">
              No links in this column.
            </p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {col.links.map((link, li) => (
                <div
                  key={li}
                  className="grid grid-cols-[1fr_2fr_auto] items-center gap-2"
                >
                  <Input
                    className="bg-background"
                    value={link.label}
                    placeholder="Label"
                    onChange={(e) =>
                      updateLink(ci, li, { label: e.target.value })
                    }
                  />
                  <Input
                    className="bg-background"
                    type="url"
                    value={link.href}
                    placeholder="https://… or /path"
                    onChange={(e) =>
                      updateLink(ci, li, { href: e.target.value })
                    }
                  />
                  <button
                    type="button"
                    aria-label={`Remove link ${li + 1}`}
                    onClick={() => removeLink(ci, li)}
                    className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </FormCard>
      ))}
      <Button
        size="sm"
        variant="outline"
        className="self-start"
        onClick={addColumn}
      >
        <Plus className="size-3.5" /> Add column
      </Button>
      <TextCard
        label="Copyright"
        value={values.copyright}
        onChange={(v) => onChange({ copyright: v })}
        placeholder="© Acme — all rights reserved"
      />
    </div>
  );
}
