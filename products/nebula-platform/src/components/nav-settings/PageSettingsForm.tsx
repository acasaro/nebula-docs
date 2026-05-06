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
import type { IconValue } from '@/components/IconField';
import { SelectRow, TextRow, ToggleRow } from './FormRow';
import { IconRow } from './IconRow';
import { KeywordsRow } from './KeywordsRow';

export interface PageConfigValues {
  externalUrl: string;
  icon: IconValue;
  sidebarTitle: string;
  tag: string;
  hidden: boolean;
}

export interface PageFrontmatterValues {
  title: string;
  description: string;
  ogImage: string;
  keywords: string[];
  mode: string;
}

interface PageSettingsFormProps {
  slug: string;
  configValues: PageConfigValues;
  frontmatterValues: PageFrontmatterValues;
  onConfigChange: (patch: Partial<PageConfigValues>) => void;
  onFrontmatterChange: (patch: Partial<PageFrontmatterValues>) => void;
}

const MODE_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'wide', label: 'Wide' },
  { value: 'custom', label: 'Custom' },
] as const;

/**
 * Page settings form — fields split between `docs.json` page-object entries
 * (icon, sidebarTitle, externalUrl, tag, hidden) and the file's MDX
 * frontmatter (title, description, ogImage, keywords, mode). The parent
 * routes patches by field destination.
 */
export function PageSettingsForm({
  slug,
  configValues,
  frontmatterValues,
  onConfigChange,
  onFrontmatterChange,
}: PageSettingsFormProps) {
  const tagEnabled = configValues.tag.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <TextRow
        label="Title"
        icon={Type}
        value={frontmatterValues.title}
        onChange={(v) => onFrontmatterChange({ title: v })}
        placeholder="Page title"
      />
      <TextRow
        label="Slug"
        icon={LinkIcon}
        value={slug}
        onChange={() => undefined}
        placeholder="path/to/page"
      />
      <TextRow
        label="External URL"
        icon={ExternalLink}
        type="url"
        value={configValues.externalUrl}
        onChange={(v) => onConfigChange({ externalUrl: v })}
        placeholder="https://…"
      />
      <TextRow
        label="Description"
        icon={AlignLeft}
        value={frontmatterValues.description}
        onChange={(v) => onFrontmatterChange({ description: v })}
        placeholder="Short summary"
      />
      <IconRow
        value={configValues.icon}
        onChange={(v) => onConfigChange({ icon: v })}
      />
      <TextRow
        label="Sidebar title"
        icon={PanelLeft}
        value={configValues.sidebarTitle}
        onChange={(v) => onConfigChange({ sidebarTitle: v })}
        placeholder="Shown in the sidebar"
      />
      <TextRow
        label="OG Image URL"
        icon={ImageIcon}
        type="url"
        value={frontmatterValues.ogImage}
        onChange={(v) => onFrontmatterChange({ ogImage: v })}
        placeholder="https://…"
      />
      <ToggleRow
        label="Tag"
        icon={Tag}
        checked={tagEnabled}
        onChange={(v) => onConfigChange({ tag: v ? configValues.tag || ' ' : '' })}
      />
      {tagEnabled ? (
        <TextRow
          label="Tag value"
          icon={Tag}
          value={configValues.tag}
          onChange={(v) => onConfigChange({ tag: v })}
          placeholder="NEW, BETA, …"
        />
      ) : null}
      <ToggleRow
        label="Hidden"
        icon={EyeOff}
        checked={configValues.hidden}
        onChange={(v) => onConfigChange({ hidden: v })}
        labels={['Yes', 'No']}
      />
      <KeywordsRow
        value={frontmatterValues.keywords}
        onChange={(v) => onFrontmatterChange({ keywords: v })}
      />
      <SelectRow
        label="Mode"
        icon={Settings2}
        value={frontmatterValues.mode}
        onChange={(v) => onFrontmatterChange({ mode: v })}
        options={MODE_OPTIONS}
        placeholder="Default"
      />
    </div>
  );
}
