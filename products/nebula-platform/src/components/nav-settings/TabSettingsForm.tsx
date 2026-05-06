import { AlignHorizontalJustifyStart, EyeOff, FolderTree, Link as LinkIcon, Type } from 'lucide-react';
import { useState } from 'react';
import type { IconValue } from '@/components/IconField';
import { SelectRow, TextRow, ToggleRow } from './FormRow';
import { IconRow } from './IconRow';

interface TabSettingsState {
  title: string;
  icon: IconValue;
  hidden: boolean;
  href: string;
  align: string;
  directory: string;
}

const INITIAL_STATE: TabSettingsState = {
  title: '',
  icon: {},
  hidden: false,
  href: '',
  align: 'start',
  directory: 'none',
};

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
 * Tab settings form — drawn entirely from `docs.json`'s tab entry.
 * Phase A is local-state only.
 */
export function TabSettingsForm() {
  const [state, setState] = useState<TabSettingsState>(INITIAL_STATE);
  const set = <K extends keyof TabSettingsState>(key: K, value: TabSettingsState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="flex flex-col gap-5">
      <TextRow
        label="Title"
        icon={Type}
        value={state.title}
        onChange={(v) => set('title', v)}
        placeholder="Tab title"
      />
      <IconRow value={state.icon} onChange={(v) => set('icon', v)} />
      <ToggleRow
        label="Hidden"
        icon={EyeOff}
        checked={state.hidden}
        onChange={(v) => set('hidden', v)}
        labels={['Yes', 'No']}
      />
      <TextRow
        label="href"
        icon={LinkIcon}
        type="url"
        value={state.href}
        onChange={(v) => set('href', v)}
        placeholder="https://… or /path"
      />
      <SelectRow
        label="Align"
        icon={AlignHorizontalJustifyStart}
        value={state.align}
        onChange={(v) => set('align', v)}
        options={ALIGN_OPTIONS}
      />
      <SelectRow
        label="Directory"
        icon={FolderTree}
        value={state.directory}
        onChange={(v) => set('directory', v)}
        options={DIRECTORY_OPTIONS}
      />
    </div>
  );
}
