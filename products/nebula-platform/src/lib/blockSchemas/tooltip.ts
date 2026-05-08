import { HelpCircle, Link as LinkIcon, Type } from 'lucide-react';
import type { BlockAttrSchema } from './types';

const SIDE_OPTIONS = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
] as const;

const ALIGN_OPTIONS = [
  { value: 'start', label: 'Start' },
  { value: 'center', label: 'Center' },
  { value: 'end', label: 'End' },
] as const;

export const tooltipSchema: BlockAttrSchema = {
  blockType: 'mdxTooltip',
  title: 'Edit Tooltip',
  headerIcon: HelpCircle,
  inlinePopover: true,
  sections: [
    {
      label: 'Trigger',
      fields: [
        {
          kind: 'text',
          key: 'text',
          label: 'Trigger text',
          icon: Type,
          placeholder: 'API',
        },
      ],
    },
    {
      label: 'Popup',
      fields: [
        {
          kind: 'text',
          key: 'title',
          label: 'Title',
          icon: Type,
          placeholder: 'Tooltip title',
        },
        {
          kind: 'text',
          key: 'description',
          label: 'Description',
          icon: Type,
          placeholder: 'Additional details shown on hover',
        },
        {
          kind: 'text',
          key: 'cta',
          label: 'CTA label',
          icon: Type,
          placeholder: 'Learn more',
        },
        {
          kind: 'text',
          key: 'href',
          label: 'CTA link',
          icon: LinkIcon,
          placeholder: 'https://…',
          type: 'url',
        },
      ],
    },
    {
      label: 'Position',
      fields: [
        {
          kind: 'select',
          key: 'side',
          label: 'Side',
          options: SIDE_OPTIONS,
          placeholder: 'Top',
        },
        {
          kind: 'select',
          key: 'align',
          label: 'Align',
          options: ALIGN_OPTIONS,
          placeholder: 'Center',
        },
      ],
    },
  ],
};
