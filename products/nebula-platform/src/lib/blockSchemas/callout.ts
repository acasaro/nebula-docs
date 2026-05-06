import { AlignLeft, MessageSquare, Palette } from 'lucide-react';
import type { BlockAttrSchema } from './types';

const VARIANT_OPTIONS = [
  { value: 'note', label: 'Note' },
  { value: 'info', label: 'Info' },
  { value: 'tip', label: 'Tip' },
  { value: 'check', label: 'Check' },
  { value: 'warning', label: 'Warning' },
  { value: 'danger', label: 'Danger' },
  { value: 'custom', label: 'Custom' },
] as const;

export const calloutSchema: BlockAttrSchema = {
  blockType: 'mdxCallout',
  title: 'Edit Callout',
  headerIcon: MessageSquare,
  sections: [
    {
      label: 'Content',
      fields: [
        {
          kind: 'text',
          key: 'title',
          label: 'Title',
          icon: AlignLeft,
          placeholder: 'Callout title (optional)',
        },
        {
          kind: 'select',
          key: 'variant',
          label: 'Variant',
          options: VARIANT_OPTIONS,
          placeholder: 'Select variant',
        },
      ],
    },
    {
      label: 'Custom variant',
      fields: [
        {
          kind: 'text',
          key: 'color',
          label: 'Color',
          icon: Palette,
          placeholder: '#6366f1',
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
  ],
};
