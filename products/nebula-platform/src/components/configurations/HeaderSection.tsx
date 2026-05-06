import { Plus, Trash2 } from 'lucide-react';
import { FormCard } from './FormCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { DocsConfig } from '@/lib/docsConfig';

export interface NavbarLinkValue {
  label: string;
  href: string;
}

export interface NavbarPrimaryValue {
  label: string;
  href: string;
}

export interface HeaderValues {
  primary: NavbarPrimaryValue;
  links: NavbarLinkValue[];
}

interface NavbarShape {
  links?: Array<{ label?: string; href?: string; icon?: unknown }>;
  primary?: { type?: string; label?: string; href?: string };
}

export function readHeader(config: DocsConfig): HeaderValues {
  const navbar = (config as DocsConfig & { navbar?: NavbarShape }).navbar ?? {};
  return {
    primary: {
      label: navbar.primary?.label ?? '',
      href: navbar.primary?.href ?? '',
    },
    links: (navbar.links ?? []).map((l) => ({
      label: l.label ?? '',
      href: l.href ?? '',
    })),
  };
}

export function applyHeader(
  config: DocsConfig,
  patch: Partial<HeaderValues>,
): DocsConfig {
  const next = JSON.parse(JSON.stringify(config)) as DocsConfig & {
    navbar?: NavbarShape;
  };
  const navbar: NavbarShape = next.navbar ?? {};

  if (patch.primary !== undefined) {
    const hasContent = patch.primary.label.trim() || patch.primary.href.trim();
    if (hasContent) {
      navbar.primary = {
        type: 'button',
        label: patch.primary.label,
        href: patch.primary.href,
      };
    } else {
      delete navbar.primary;
    }
  }

  if (patch.links !== undefined) {
    if (patch.links.length === 0) {
      delete navbar.links;
    } else {
      navbar.links = patch.links.map((l) => ({
        label: l.label,
        href: l.href,
      }));
    }
  }

  if (Object.keys(navbar).length === 0) {
    delete next.navbar;
  } else {
    next.navbar = navbar;
  }
  return next;
}

interface HeaderSectionProps {
  values: HeaderValues;
  onChange: (patch: Partial<HeaderValues>) => void;
}

export function HeaderSection({ values, onChange }: HeaderSectionProps) {
  const updateLink = (index: number, patch: Partial<NavbarLinkValue>) => {
    const next = values.links.map((link, i) =>
      i === index ? { ...link, ...patch } : link,
    );
    onChange({ links: next });
  };

  const removeLink = (index: number) => {
    onChange({ links: values.links.filter((_, i) => i !== index) });
  };

  const addLink = () => {
    onChange({ links: [...values.links, { label: '', href: '' }] });
  };

  return (
    <div className="flex flex-col gap-3">
      <FormCard label="Primary button">
        <div className="grid grid-cols-[1fr_2fr] gap-2">
          <Input
            className="bg-background"
            value={values.primary.label}
            placeholder="Get an API key"
            onChange={(e) =>
              onChange({
                primary: { ...values.primary, label: e.target.value },
              })
            }
          />
          <Input
            className="bg-background"
            type="url"
            value={values.primary.href}
            placeholder="/quickstart"
            onChange={(e) =>
              onChange({
                primary: { ...values.primary, href: e.target.value },
              })
            }
          />
        </div>
      </FormCard>

      <FormCard
        label="Navbar links"
        action={
          <Button size="sm" variant="outline" onClick={addLink}>
            <Plus className="size-3.5" /> Add
          </Button>
        }
      >
        {values.links.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No navbar links. Click <span className="font-medium">Add</span> to
            create one.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {values.links.map((link, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_2fr_auto] items-center gap-2"
              >
                <Input
                  className="bg-background"
                  value={link.label}
                  placeholder="Label"
                  onChange={(e) => updateLink(i, { label: e.target.value })}
                />
                <Input
                  className="bg-background"
                  type="url"
                  value={link.href}
                  placeholder="https://… or /path"
                  onChange={(e) => updateLink(i, { href: e.target.value })}
                />
                <button
                  type="button"
                  aria-label={`Remove link ${i + 1}`}
                  onClick={() => removeLink(i)}
                  className="flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </FormCard>
    </div>
  );
}
