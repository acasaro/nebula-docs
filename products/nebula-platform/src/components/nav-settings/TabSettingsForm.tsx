import {
  AlignHorizontalJustifyStart,
  EyeOff,
  FileText,
  FolderTree,
  Link as LinkIcon,
  Type,
} from 'lucide-react';
import type { IconValue } from '@/components/IconField';
import { SelectRow, TextRow, ToggleRow } from './FormRow';
import { IconRow } from './IconRow';

export interface TabConfigValues {
  title: string;
  icon: IconValue;
  hidden: boolean;
  href: string;
  align: string;
  directory: string;
}

export interface PagePickerOption {
  /** The page slug as written in docs.json (e.g. "developers/overview"). */
  slug: string;
  /** Human-readable label drawn from sidebarTitle / page title. */
  label: string;
}

interface TabSettingsFormProps {
  values: TabConfigValues;
  onChange: (patch: Partial<TabConfigValues>) => void;
  /** Pages reachable inside this tab — used to power the page-picker on the
   *  href row. Empty array hides the picker (custom URL is the only option). */
  availablePages?: ReadonlyArray<PagePickerOption>;
}

const ALIGN_OPTIONS = [
  { value: 'start', label: 'Start' },
  { value: 'end', label: 'End' },
] as const;

const DIRECTORY_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'accordion', label: 'Accordion' },
  { value: 'card', label: 'Card' },
] as const;

const CUSTOM_URL_VALUE = '__custom__';
const NONE_VALUE = '__none__';

/**
 * Tab settings form — fields drawn entirely from `docs.json`'s tab entry.
 * Parent owns state.
 *
 * The href field has two surfaces: a page-picker `SelectRow` (lists every
 * page reachable inside this tab) and a free-text `TextRow` for external
 * URLs or custom paths. Picking a page from the dropdown writes `/<slug>`
 * into href; the text row is the override hatch and is always visible so
 * the user can see / edit the literal value being written.
 *
 * Sentinel values (`__none__` / `__custom__`) are required because Radix
 * Select does not allow empty-string item values — passing `value=""`
 * crashes the component with "<SelectItem> must have a value prop that is
 * not an empty string."
 */
export function TabSettingsForm({
  values,
  onChange,
  availablePages = [],
}: TabSettingsFormProps) {
  // Match href back to a page slug for the picker's selected value. If the
  // current href is `/${slug}` for one of the tab's pages, the picker shows
  // that page; otherwise it falls back to "Custom URL".
  const matchedSlug = availablePages.find((p) => values.href === `/${p.slug}`)?.slug;
  const pickerValue = matchedSlug ?? (values.href ? CUSTOM_URL_VALUE : NONE_VALUE);
  const pageOptions = [
    { value: NONE_VALUE, label: '(none — implicit first page)' },
    ...availablePages.map((p) => ({ value: p.slug, label: p.label })),
    { value: CUSTOM_URL_VALUE, label: 'Custom URL or external link…' },
  ];
  return (
    <div className="flex flex-col gap-5">
      <TextRow
        label="Title"
        icon={Type}
        value={values.title}
        onChange={(v) => onChange({ title: v })}
        placeholder="Tab title"
      />
      <IconRow value={values.icon} onChange={(v) => onChange({ icon: v })} />
      <ToggleRow
        label="Hidden"
        icon={EyeOff}
        checked={values.hidden}
        onChange={(v) => onChange({ hidden: v })}
        labels={['Yes', 'No']}
      />
      {availablePages.length > 0 && (
        <SelectRow
          label="Landing"
          icon={FileText}
          value={pickerValue}
          onChange={(v) => {
            if (v === CUSTOM_URL_VALUE) {
              // No-op for href — let the user edit the text row. This keeps
              // a stale href from being clobbered when the user opens the
              // picker just to inspect.
              return;
            }
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
      <SelectRow
        label="Align"
        icon={AlignHorizontalJustifyStart}
        value={values.align}
        onChange={(v) => onChange({ align: v })}
        options={ALIGN_OPTIONS}
      />
      <SelectRow
        label="Directory"
        icon={FolderTree}
        value={values.directory}
        onChange={(v) => onChange({ directory: v })}
        options={DIRECTORY_OPTIONS}
      />
    </div>
  );
}
