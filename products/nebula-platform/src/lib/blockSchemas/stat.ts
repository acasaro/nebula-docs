import { Hash, Palette, Type } from 'lucide-react';
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

export const statSchema: BlockAttrSchema = {
  blockType: 'mdxStat',
  title: 'Edit Stat',
  headerIcon: Hash,
  inlinePopover: true,
  sections: [
    {
      label: 'Content',
      fields: [
        {
          kind: 'text',
          key: 'value',
          label: 'Value',
          icon: Hash,
          placeholder: 'e.g. 40+, 100%',
        },
        {
          kind: 'text',
          key: 'label',
          label: 'Label',
          icon: Type,
          placeholder: 'Descriptor',
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
