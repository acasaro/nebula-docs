import { AlignLeft, FolderTree, Link as LinkIcon, Palette, Type } from 'lucide-react';
import type { BlockAttrSchema } from './types';

const COLOR_SWATCHES = [
  { value: 'neutral', color: 'var(--brand-neutral-dark)', label: 'Neutral' },
  { value: 'blue', color: 'var(--brand-blue-mid)', label: 'Blue' },
  { value: 'green', color: 'var(--brand-green-mid)', label: 'Green' },
  { value: 'orange', color: 'var(--brand-orange-mid)', label: 'Orange' },
  { value: 'yellow', color: 'var(--brand-yellow-mid)', label: 'Yellow' },
  { value: 'red', color: 'var(--brand-red-mid)', label: 'Red' },
  { value: 'purple', color: 'var(--brand-purple-mid)', label: 'Purple' },
  { value: 'teal', color: 'var(--brand-teal-mid)', label: 'Teal' },
] as const;

export const topicCardSchema: BlockAttrSchema = {
  blockType: 'mdxTopicCard',
  title: 'Edit Topic Card',
  headerIcon: FolderTree,
  inlinePopover: true,
  sections: [
    {
      label: 'Content',
      fields: [
        {
          kind: 'text',
          key: 'title',
          label: 'Title',
          icon: Type,
          placeholder: 'Topic title',
        },
        {
          kind: 'text',
          key: 'description',
          label: 'Description',
          icon: AlignLeft,
          placeholder: 'Short description',
        },
        {
          kind: 'icon',
          key: 'icon',
          libraryKey: 'iconLibrary',
          typeKey: 'iconType',
          label: 'Icon',
        },
      ],
    },
    {
      label: 'View all link',
      fields: [
        {
          kind: 'text',
          key: 'viewAllHref',
          label: '"View all" URL',
          icon: LinkIcon,
          placeholder: 'https://…',
          type: 'url',
        },
      ],
    },
    {
      label: 'Appearance',
      fields: [
        {
          kind: 'swatch',
          key: 'color',
          label: 'Color',
          icon: Palette,
          options: COLOR_SWATCHES,
        },
      ],
    },
  ],
};
