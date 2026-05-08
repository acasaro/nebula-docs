import {
  Layers,
  Layout,
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

const ACCENT_OPTIONS = [
  { value: 'top-bar', label: 'Top bar' },
  { value: 'none', label: 'None' },
] as const;

const LAYOUT_OPTIONS = [
  { value: 'vertical', label: 'Vertical' },
  { value: 'horizontal', label: 'Horizontal' },
] as const;

export const featureCardSchema: BlockAttrSchema = {
  blockType: 'mdxFeatureCard',
  title: 'Edit Feature Card',
  headerIcon: Layout,
  inlinePopover: true,
  sections: [
    {
      label: 'Content',
      fields: [
        {
          kind: 'icon',
          key: 'icon',
          libraryKey: 'iconLibrary',
          typeKey: 'iconType',
          label: 'Icon',
        },
        {
          kind: 'text',
          key: 'pill',
          label: 'Pill (status badge)',
          icon: Tag,
          placeholder: 'e.g. LIVE, NEW',
        },
      ],
    },
    {
      label: 'Link',
      fields: [
        {
          kind: 'text',
          key: 'linkText',
          label: 'Link text',
          icon: Type,
          placeholder: 'e.g. Learn more',
        },
        {
          kind: 'text',
          key: 'linkUrl',
          label: 'Link URL',
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
        {
          kind: 'select',
          key: 'accent',
          label: 'Accent',
          icon: Layers,
          options: ACCENT_OPTIONS,
          placeholder: 'Top bar',
        },
        {
          kind: 'select',
          key: 'layout',
          label: 'Layout',
          icon: Layout,
          options: LAYOUT_OPTIONS,
          placeholder: 'Vertical',
        },
      ],
    },
  ],
};
