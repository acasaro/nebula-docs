import {
  AlignLeft,
  Image as ImageIcon,
  Link as LinkIcon,
  Palette,
  Tag,
  Type,
} from 'lucide-react';
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

export const mediaCardSchema: BlockAttrSchema = {
  blockType: 'mdxMediaCard',
  title: 'Edit Media Card',
  headerIcon: ImageIcon,
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
          placeholder: 'Card title',
        },
        {
          kind: 'text',
          key: 'description',
          label: 'Description',
          icon: AlignLeft,
          placeholder: 'Short description',
        },
      ],
    },
    {
      label: 'Image',
      fields: [
        {
          kind: 'text',
          key: 'image',
          label: 'Image URL',
          icon: ImageIcon,
          placeholder: 'https://…',
          type: 'url',
          upload: true,
          uploadCategory: 'image',
        },
        {
          kind: 'text',
          key: 'imageAlt',
          label: 'Image alt text',
          icon: Type,
          placeholder: 'Descriptive alt text (a11y)',
        },
      ],
    },
    {
      label: 'Link',
      fields: [
        {
          kind: 'text',
          key: 'href',
          label: 'Card URL',
          icon: LinkIcon,
          placeholder: 'https://…',
          type: 'url',
        },
      ],
    },
    {
      label: 'Category badge',
      fields: [
        {
          kind: 'text',
          key: 'category',
          label: 'Category text',
          icon: Tag,
          placeholder: 'e.g. PLATFORM, DEVELOPMENT',
        },
        {
          kind: 'swatch',
          key: 'categoryColor',
          label: 'Category color',
          icon: Palette,
          options: COLOR_SWATCHES,
        },
      ],
    },
  ],
};
