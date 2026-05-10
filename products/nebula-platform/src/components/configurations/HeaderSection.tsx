import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Icon } from '@nebula-docs/components';
import { FormCard } from './FormCard';
import { ColorField } from '@/components/ColorField';
import {
  IconPickerPopover,
  docsIconToForm,
  formIconToDocs,
  type DocsIconValue,
  type IconValue as FormIconValue,
} from '@/components/IconField';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { DocsConfig } from '@/lib/docsConfig';

export interface NavbarLinkValue {
  label: string;
  href: string;
  icon?: DocsIconValue;
  /** Hex color (`#rrggbb`) applied to the leading icon only. */
  color?: string;
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
  links?: Array<{
    label?: string;
    href?: string;
    icon?: DocsIconValue;
    color?: string;
  }>;
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
      icon: l.icon,
      color: l.color,
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
      navbar.links = patch.links.map((l) => {
        const entry: NonNullable<NavbarShape['links']>[number] = {
          label: l.label,
          href: l.href,
        };
        if (l.icon !== undefined) entry.icon = l.icon;
        if (l.color) entry.color = l.color;
        return entry;
      });
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
    <div className='flex flex-col gap-3'>
      <FormCard label='Primary button'>
        <div className='grid grid-cols-[1fr_2fr] gap-2'>
          <Input
            className='bg-background'
            value={values.primary.label}
            placeholder='Get an API key'
            onChange={(e) =>
              onChange({
                primary: { ...values.primary, label: e.target.value },
              })
            }
          />
          <Input
            className='bg-background'
            type='url'
            value={values.primary.href}
            placeholder='/quickstart'
            onChange={(e) =>
              onChange({
                primary: { ...values.primary, href: e.target.value },
              })
            }
          />
        </div>
      </FormCard>

      <FormCard
        label='Navbar links'
        action={
          <Button size='sm' variant='outline' onClick={addLink}>
            <Plus className='size-3.5' /> Add
          </Button>
        }
      >
        {values.links.length === 0 ? (
          <p className='text-xs text-muted-foreground'>
            No navbar links. Click <span className='font-medium'>Add</span> to
            create one.
          </p>
        ) : (
          <div className='flex flex-col gap-2'>
            {values.links.map((link, i) => (
              <NavbarLinkRow
                key={i}
                index={i}
                link={link}
                onChange={(patch) => updateLink(i, patch)}
                onRemove={() => removeLink(i)}
              />
            ))}
          </div>
        )}
      </FormCard>
    </div>
  );
}

interface NavbarLinkRowProps {
  index: number;
  link: NavbarLinkValue;
  onChange: (patch: Partial<NavbarLinkValue>) => void;
  onRemove: () => void;
}

function NavbarLinkRow({ index, link, onChange, onRemove }: NavbarLinkRowProps) {
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const formIcon = docsIconToForm(link.icon);
  const hasIcon = !!formIcon.icon;
  const color = link.color;

  const handleIconChange = (next: FormIconValue) => {
    const docsIcon = formIconToDocs(next);
    if (!docsIcon) {
      onChange({ icon: undefined, color: undefined });
    } else {
      onChange({ icon: docsIcon });
    }
  };

  return (
    <div className='grid grid-cols-[auto_auto_1fr_2fr_auto] items-center gap-2'>
      <IconPickerPopover
        open={iconPickerOpen}
        onOpenChange={setIconPickerOpen}
        value={formIcon}
        onChange={handleIconChange}
      >
        <button
          type='button'
          aria-label={hasIcon ? `Edit icon for link ${index + 1}` : `Add icon to link ${index + 1}`}
          className={cn(
            'flex size-9 items-center justify-center rounded-md border bg-background transition-colors',
            'hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
          )}
          style={hasIcon && color ? { color } : undefined}
        >
          {hasIcon ? (
            <Icon
              icon={formIcon.icon}
              iconLibrary={formIcon.iconLibrary}
              iconType={formIcon.iconType}
              size={16}
            />
          ) : (
            <Plus className='size-3.5 text-muted-foreground' />
          )}
        </button>
      </IconPickerPopover>

      <ColorField
        value={color}
        onChange={(next) => onChange({ color: next })}
        className='w-28'
      />

      <Input
        className='bg-background'
        value={link.label}
        placeholder='Label'
        onChange={(e) => onChange({ label: e.target.value })}
      />
      <Input
        className='bg-background'
        type='url'
        value={link.href}
        placeholder='https://… or /path'
        onChange={(e) => onChange({ href: e.target.value })}
      />
      <button
        type='button'
        aria-label={`Remove link ${index + 1}`}
        onClick={onRemove}
        className='flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive'
      >
        <Trash2 className='size-4' />
      </button>
    </div>
  );
}
