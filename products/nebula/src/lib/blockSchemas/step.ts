import { Footprints, Hash } from 'lucide-react';
import type { BlockAttrSchema } from './types';

const TITLE_SIZE_OPTIONS = [
  { value: 'p', label: 'Paragraph' },
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' },
  { value: 'h4', label: 'Heading 4' },
] as const;

const ICON_TYPE_OPTIONS = [
  { value: 'outlined', label: 'Outlined' },
  { value: 'filled', label: 'Filled' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'sharp', label: 'Sharp' },
  { value: 'two-tone', label: 'Two-tone' },
] as const;

export const stepSchema: BlockAttrSchema = {
  blockType: 'mdxStep',
  title: 'Edit Step',
  headerIcon: Footprints,
  sections: [
    {
      label: 'Icon',
      fields: [
        {
          kind: 'icon',
          key: 'icon',
          libraryKey: 'iconLibrary',
          typeKey: 'iconType',
          label: 'Select Icon',
        },
        {
          kind: 'select',
          key: 'iconType',
          label: 'Icon Type',
          options: ICON_TYPE_OPTIONS,
          placeholder: 'Default',
        },
      ],
    },
    {
      label: 'Appearance',
      fields: [
        {
          kind: 'text',
          key: 'stepNumber',
          label: 'Step Number',
          icon: Hash,
          placeholder: 'Auto',
        },
        {
          kind: 'select',
          key: 'titleSize',
          label: 'Title Size',
          options: TITLE_SIZE_OPTIONS,
          placeholder: 'Inherit from parent',
        },
      ],
    },
  ],
};
