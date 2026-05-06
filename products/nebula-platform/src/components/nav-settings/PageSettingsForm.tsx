import {
  AlignLeft,
  ExternalLink,
  EyeOff,
  Image as ImageIcon,
  Link as LinkIcon,
  PanelLeft,
  Settings2,
  Tag,
  Type,
} from 'lucide-react';
import { useState } from 'react';
import type { IconValue } from '@/components/IconField';
import { SelectRow, TextRow, ToggleRow } from './FormRow';
import { IconRow } from './IconRow';
import { KeywordsRow } from './KeywordsRow';

interface PageSettingsState {
  title: string;
  slug: string;
  externalUrl: string;
  description: string;
  icon: IconValue;
  sidebarTitle: string;
  ogImage: string;
  tagEnabled: boolean;
  tag: string;
  hidden: boolean;
  keywords: string[];
  mode: string;
}

const INITIAL_STATE: PageSettingsState = {
  title: '',
  slug: '',
  externalUrl: '',
  description: '',
  icon: {},
  sidebarTitle: '',
  ogImage: '',
  tagEnabled: false,
  tag: '',
  hidden: false,
  keywords: [],
  mode: 'default',
};

const MODE_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'wide', label: 'Wide' },
  { value: 'custom', label: 'Custom' },
] as const;

/**
 * Page settings form — 11 fields drawn from `docs.json`'s page-object entry
 * and the MDX file's frontmatter. Phase A is local-state only; Phase B will
 * hydrate from the two sources and Phase C will write back.
 */
export function PageSettingsForm() {
  const [state, setState] = useState<PageSettingsState>(INITIAL_STATE);
  const set = <K extends keyof PageSettingsState>(key: K, value: PageSettingsState[K]) =>
    setState((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="flex flex-col gap-5">
      <TextRow
        label="Title"
        icon={Type}
        value={state.title}
        onChange={(v) => set('title', v)}
        placeholder="Page title"
      />
      <TextRow
        label="Slug"
        icon={LinkIcon}
        value={state.slug}
        onChange={(v) => set('slug', v)}
        placeholder="path/to/page"
      />
      <TextRow
        label="External URL"
        icon={ExternalLink}
        type="url"
        value={state.externalUrl}
        onChange={(v) => set('externalUrl', v)}
        placeholder="https://…"
      />
      <TextRow
        label="Description"
        icon={AlignLeft}
        value={state.description}
        onChange={(v) => set('description', v)}
        placeholder="Short summary"
      />
      <IconRow value={state.icon} onChange={(v) => set('icon', v)} />
      <TextRow
        label="Sidebar title"
        icon={PanelLeft}
        value={state.sidebarTitle}
        onChange={(v) => set('sidebarTitle', v)}
        placeholder="Shown in the sidebar"
      />
      <TextRow
        label="OG Image URL"
        icon={ImageIcon}
        type="url"
        value={state.ogImage}
        onChange={(v) => set('ogImage', v)}
        placeholder="https://…"
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
        label="Hidden"
        icon={EyeOff}
        checked={state.hidden}
        onChange={(v) => set('hidden', v)}
        labels={['Yes', 'No']}
      />
      <KeywordsRow value={state.keywords} onChange={(v) => set('keywords', v)} />
      <SelectRow
        label="Mode"
        icon={Settings2}
        value={state.mode}
        onChange={(v) => set('mode', v)}
        options={MODE_OPTIONS}
        placeholder="Default"
      />
    </div>
  );
}
