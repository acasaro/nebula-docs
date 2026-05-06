import { ChevronDown, EyeOff, FileCode, Tag, Type } from 'lucide-react';
import type { IconValue } from '@/components/IconField';
import { TextRow, ToggleRow } from './FormRow';
import { IconRow } from './IconRow';

export interface GroupConfigValues {
  title: string;
  icon: IconValue;
  hidden: boolean;
  tag: string;
  expanded: boolean;
  openapi: string;
  asyncapi: string;
}

interface GroupSettingsFormProps {
  values: GroupConfigValues;
  onChange: (patch: Partial<GroupConfigValues>) => void;
}

/**
 * Group settings form — fields drawn entirely from `docs.json`'s group
 * entry. The parent owns state and threads in patches.
 */
export function GroupSettingsForm({
  values,
  onChange,
}: GroupSettingsFormProps) {
  const tagEnabled = values.tag.length > 0;

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
