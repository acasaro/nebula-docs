import { ChevronDown, EyeOff, FileCode, Tag, Type } from 'lucide-react';
import { useState } from 'react';
import type { IconValue } from '@/components/IconField';
import { TextRow, ToggleRow } from './FormRow';
import { IconRow } from './IconRow';

interface GroupSettingsState {
  title: string;
  icon: IconValue;
  hidden: boolean;
  tagEnabled: boolean;
  tag: string;
  expanded: boolean;
  openapi: string;
  asyncapi: string;
}

const INITIAL_STATE: GroupSettingsState = {
  title: '',
  icon: {},
  hidden: false,
  tagEnabled: false,
  tag: '',
  expanded: true,
  openapi: '',
  asyncapi: '',
};

/**
 * Group settings form — drawn entirely from `docs.json`'s group entry.
 * Phase A is local-state only.
 */
export function GroupSettingsForm() {
  const [state, setState] = useState<GroupSettingsState>(INITIAL_STATE);
  const set = <K extends keyof GroupSettingsState>(key: K, value: GroupSettingsState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="flex flex-col gap-5">
      <TextRow
        label="Title"
        icon={Type}
        value={state.title}
        onChange={(v) => set('title', v)}
        placeholder="Group title"
      />
      <IconRow value={state.icon} onChange={(v) => set('icon', v)} />
      <ToggleRow
        label="Hidden"
        icon={EyeOff}
        checked={state.hidden}
        onChange={(v) => set('hidden', v)}
        labels={['Yes', 'No']}
      />
      <ToggleRow
        label="Tag"
        icon={Tag}
        checked={state.tagEnabled}
        onChange={(v) => set('tagEnabled', v)}
      />
      {state.tagEnabled ? (
        <TextRow
          label="Tag value"
          icon={Tag}
          value={state.tag}
          onChange={(v) => set('tag', v)}
          placeholder="NEW, BETA, …"
        />
      ) : null}
      <ToggleRow
        label="Expanded"
        icon={ChevronDown}
        checked={state.expanded}
        onChange={(v) => set('expanded', v)}
      />
      <TextRow
        label="OpenAPI"
        icon={FileCode}
        value={state.openapi}
        onChange={(v) => set('openapi', v)}
        placeholder="path/to/spec.yaml or https://…"
      />
      <TextRow
        label="AsyncAPI"
        icon={FileCode}
        value={state.asyncapi}
        onChange={(v) => set('asyncapi', v)}
        placeholder="path/to/spec.yaml or https://…"
      />
    </div>
  );
}
