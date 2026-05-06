import {
  AlignHorizontalJustifyStart,
  EyeOff,
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

interface TabSettingsFormProps {
  values: TabConfigValues;
  onChange: (patch: Partial<TabConfigValues>) => void;
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

/**
 * Tab settings form — fields drawn entirely from `docs.json`'s tab entry.
 * Parent owns state.
 */
export function TabSettingsForm({ values, onChange }: TabSettingsFormProps) {
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
