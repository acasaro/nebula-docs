import {
  AlignCenter,
  Columns2,
  Image as ImageIcon,
  Info,
  LayoutTemplate,
  Link as LinkIcon,
} from 'lucide-react';
import type { BlockAttrSchema } from './types';

const ALIGN_OPTIONS = [
  { value: 'start', label: 'Start (default)' },
  { value: 'center', label: 'Center' },
] as const;

export const cardSchema: BlockAttrSchema = {
  blockType: 'mdxCard',
  title: 'Edit Card Attributes',
  headerIcon: LayoutTemplate,
  inlinePopover: true,
  sections: [
    {
      label: 'Content',
      fields: [
        {
          kind: 'text',
          key: 'href',
          label: 'URL',
          icon: LinkIcon,
          placeholder: 'Enter URL',
          type: 'url',
        },
        {
          kind: 'text',
          key: 'img',
          label: 'Image Path',
          icon: ImageIcon,
          placeholder: 'Enter Image Path',
          type: 'url',
        },
        {
          kind: 'text',
          key: 'cta',
          label: 'Call To Action',
          icon: Info,
          placeholder: 'Enter Call To Action',
        },
      ],
    },
    {
      label: 'Appearance',
      fields: [
        {
          kind: 'toggle',
          key: 'horizontal',
          label: 'Horizontal',
          icon: Columns2,
        },
        {
          kind: 'select',
          key: 'align',
          label: 'Alignment',
          icon: AlignCenter,
          options: ALIGN_OPTIONS,
          placeholder: 'Start (default)',
        },
      ],
    },
  ],
};
