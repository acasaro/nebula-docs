import { Link as LinkIcon, Palette, Tag, Type } from 'lucide-react';
import type { BlockAttrSchema } from './types';

const COLOR_OPTIONS = [
  { value: 'gray', label: 'Gray' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'orange', label: 'Orange' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'red', label: 'Red' },
  { value: 'purple', label: 'Purple' },
  { value: 'white', label: 'White' },
  { value: 'surface', label: 'Surface' },
] as const;

const VARIANT_OPTIONS = [
  { value: 'solid', label: 'Solid' },
  { value: 'outline', label: 'Outline' },
] as const;

const SHAPE_OPTIONS = [
  { value: 'rounded', label: 'Rounded' },
  { value: 'pill', label: 'Pill' },
] as const;

const SIZE_OPTIONS = [
  { value: 'xs', label: 'Extra small' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
] as const;

export const badgeSchema: BlockAttrSchema = {
  blockType: 'mdxBadge',
  title: 'Edit Badge',
  headerIcon: Tag,
  sections: [
    {
      label: 'Content',
      fields: [
        {
          kind: 'text',
          key: 'label',
          label: 'Label',
          icon: Type,
          placeholder: 'Badge text',
        },
        {
          kind: 'text',
          key: 'href',
          label: 'Link URL',
          icon: LinkIcon,
          placeholder: 'https://…',
          type: 'url',
        },
      ],
    },
    {
      label: 'Style',
      fields: [
        {
          kind: 'select',
          key: 'color',
          label: 'Color',
          options: COLOR_OPTIONS,
          placeholder: 'Gray',
          icon: Palette,
        },
        {
          kind: 'select',
          key: 'variant',
          label: 'Variant',
          options: VARIANT_OPTIONS,
          placeholder: 'Solid',
        },
        {
          kind: 'select',
          key: 'shape',
          label: 'Shape',
          options: SHAPE_OPTIONS,
          placeholder: 'Rounded',
        },
        {
          kind: 'select',
          key: 'size',
          label: 'Size',
          options: SIZE_OPTIONS,
          placeholder: 'Medium',
        },
      ],
    },
  ],
};
