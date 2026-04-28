import { ChevronDown, FileText, Layers, ToggleRight } from 'lucide-react';
import type { BlockAttrSchema } from './types';

const ICON_TYPE_OPTIONS = [
  { value: 'outlined', label: 'Outlined' },
  { value: 'filled', label: 'Filled' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'sharp', label: 'Sharp' },
  { value: 'two-tone', label: 'Two-tone' },
] as const;

export const accordionSchema: BlockAttrSchema = {
  blockType: 'mdxAccordion',
  title: 'Edit Accordion',
  headerIcon: ChevronDown,
  sections: [
    {
      label: 'Content',
      fields: [
        {
          kind: 'text',
          key: 'description',
          label: 'Description',
          icon: FileText,
          placeholder: 'Optional subtitle',
        },
      ],
    },
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
      label: 'Behavior',
      fields: [
        {
          kind: 'toggle',
          key: 'defaultOpen',
          label: 'Default Open',
          icon: ToggleRight,
        },
      ],
    },
  ],
};

export const accordionGroupSchema: BlockAttrSchema = {
  blockType: 'mdxAccordionGroup',
  title: 'Edit Accordion Group',
  headerIcon: Layers,
  sections: [],
};
