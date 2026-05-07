import { ChevronDown, EyeOff, FileCode, FileText, Tag, Type } from 'lucide-react';
import type { IconValue } from '@/components/IconField';
import type { PagePickerOption } from './TabSettingsForm';
import { SelectRow, TextRow, ToggleRow } from './FormRow';
import { IconRow } from './IconRow';

export interface GroupConfigValues {
  title: string;
  icon: IconValue;
  hidden: boolean;
  tag: string;
  expanded: boolean;
  openapi: string;
  asyncapi: string;
  /** Page slug rendered when the group title itself is clicked (Mintlify
   *  `group.root`). Empty string means "no root page — title isn't a link". */
  root: string;
}

interface GroupSettingsFormProps {
  values: GroupConfigValues;
  onChange: (patch: Partial<GroupConfigValues>) => void;
  /** Pages reachable inside this group — used to power the root page-picker.
   *  Empty array means the dropdown is hidden. */
  availablePages?: ReadonlyArray<PagePickerOption>;
}

const ROOT_NONE_VALUE = '__none__';

/**
 * Group settings form — fields drawn entirely from `docs.json`'s group
 * entry. The parent owns state and threads in patches.
 *
 * Root field implements Mintlify's `group.root`: when set, clicking the
 * group title in the rendered sidebar navigates to that page (vs. just
 * expanding/collapsing). The picker lists every page reachable inside the
 * group; `(none)` clears the field. Empty-string sentinel `__none__` is
 * required because Radix Select rejects `value=""`.
 */
export function GroupSettingsForm({
  values,
  onChange,
  availablePages = [],
}: GroupSettingsFormProps) {
  const tagEnabled = values.tag.length > 0;
  const rootOptions = [
    { value: ROOT_NONE_VALUE, label: '(none — group title not clickable)' },
    ...availablePages.map((p) => ({ value: p.slug, label: p.label })),
  ];
  const rootSelectValue = values.root ? values.root : ROOT_NONE_VALUE;

  return (
    <div className="flex flex-col gap-5">
      <TextRow
        label="Title"
        icon={Type}
        value={values.title}
        onChange={(v) => onChange({ title: v })}
        placeholder="Group title"
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
          label="Root"
          icon={FileText}
          value={rootSelectValue}
          onChange={(v) => onChange({ root: v === ROOT_NONE_VALUE ? '' : v })}
          options={rootOptions}
        />
      )}
      <ToggleRow
        label="Tag"
        icon={Tag}
        checked={tagEnabled}
        onChange={(v) => onChange({ tag: v ? values.tag || ' ' : '' })}
      />
      {tagEnabled ? (
        <TextRow
          label="Tag value"
          icon={Tag}
          value={values.tag}
          onChange={(v) => onChange({ tag: v })}
          placeholder="NEW, BETA, …"
        />
      ) : null}
      <ToggleRow
        label="Expanded"
        icon={ChevronDown}
        checked={values.expanded}
        onChange={(v) => onChange({ expanded: v })}
      />
      <TextRow
        label="OpenAPI"
        icon={FileCode}
        value={values.openapi}
        onChange={(v) => onChange({ openapi: v })}
        placeholder="path/to/spec.yaml or https://…"
      />
      <TextRow
        label="AsyncAPI"
        icon={FileCode}
        value={values.asyncapi}
        onChange={(v) => onChange({ asyncapi: v })}
        placeholder="path/to/spec.yaml or https://…"
      />
    </div>
  );
}
