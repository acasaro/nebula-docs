import {
  EyeOff,
  FileText,
  Link as LinkIcon,
  Type,
  Quote,
} from 'lucide-react';
import type { IconValue } from '@/components/IconField';
import type { PagePickerOption } from './TabSettingsForm';
import { SelectRow, TextRow, ToggleRow } from './FormRow';
import { IconRow } from './IconRow';

export type NavItemKind = 'anchor' | 'dropdown' | 'menu-item';

export interface NavItemConfigValues {
  /** Display label — `anchor.anchor` / `dropdown.dropdown` / `menu-item.item`. */
  title: string;
  icon: IconValue;
  hidden: boolean;
  href: string;
  /** Only used by `menu-item`. */
  description?: string;
}

interface NavItemSettingsFormProps {
  kind: NavItemKind;
  values: NavItemConfigValues;
  onChange: (patch: Partial<NavItemConfigValues>) => void;
  /** Pages reachable inside this item — used to power the href page-picker.
   *  Same shape and behavior as `TabSettingsForm`'s availablePages. */
  availablePages?: ReadonlyArray<PagePickerOption>;
}

const CUSTOM_URL_VALUE = '__custom__';
const NONE_VALUE = '__none__';

const TITLE_LABEL: Record<NavItemKind, string> = {
  anchor: 'Anchor',
  dropdown: 'Dropdown',
  'menu-item': 'Item',
};

/**
 * Shared settings form for the three "labeled navigation entries" Mintlify
 * supports outside of tabs/groups/pages: anchors, dropdowns, and tab-menu
 * items. They have nearly identical fields (label + icon + hidden + href
 * + optional children), so a single form handles all three with the title
 * label re-keyed per kind.
 *
 * Description is rendered only for `menu-item` (Mintlify spec) — anchors
 * and dropdowns don't carry a description.
 */
export function NavItemSettingsForm({
  kind,
  values,
  onChange,
  availablePages = [],
}: NavItemSettingsFormProps) {
  const matchedSlug = availablePages.find((p) => values.href === `/${p.slug}`)?.slug;
  const pickerValue = matchedSlug ?? (values.href ? CUSTOM_URL_VALUE : NONE_VALUE);
  const pageOptions = [
    { value: NONE_VALUE, label: '(none — no link)' },
    ...availablePages.map((p) => ({ value: p.slug, label: p.label })),
    { value: CUSTOM_URL_VALUE, label: 'Custom URL or external link…' },
  ];

  return (
    <div className="flex flex-col gap-5">
      <TextRow
        label={TITLE_LABEL[kind]}
        icon={Type}
        value={values.title}
        onChange={(v) => onChange({ title: v })}
        placeholder={`${TITLE_LABEL[kind]} label`}
      />
      <IconRow value={values.icon} onChange={(v) => onChange({ icon: v })} />
      <ToggleRow
        label="Hidden"
        icon={EyeOff}
        checked={values.hidden}
        onChange={(v) => onChange({ hidden: v })}
        labels={['Yes', 'No']}
      />
      {kind === 'menu-item' && (
        <TextRow
          label="Description"
          icon={Quote}
          value={values.description ?? ''}
          onChange={(v) => onChange({ description: v })}
          placeholder="Short tagline shown beneath the item"
        />
      )}
      {availablePages.length > 0 && (
        <SelectRow
          label="Landing"
          icon={FileText}
          value={pickerValue}
          onChange={(v) => {
            if (v === CUSTOM_URL_VALUE) return;
            if (v === NONE_VALUE) {
              onChange({ href: '' });
              return;
            }
            onChange({ href: `/${v}` });
          }}
          options={pageOptions}
        />
      )}
      <TextRow
        label="href"
        icon={LinkIcon}
        type="url"
        value={values.href}
        onChange={(v) => onChange({ href: v })}
        placeholder="https://… or /path"
      />
    </div>
  );
}
