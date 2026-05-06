import { Image as ImageIcon, Link2, Moon, Sun, Type } from 'lucide-react';
import type { BlockAttrSchema } from './types';

/**
 * Image options popover — opened from the image's own kebab (top-right of
 * the image), separate from the Frame options popover (which lives on the
 * Frame chrome). Kept inline so the BlockHandle's central kebab doesn't
 * also open it.
 */
export const imageSchema: BlockAttrSchema = {
  blockType: 'mdxImage',
  title: 'Image options',
  headerIcon: ImageIcon,
  inlinePopover: true,
  sections: [
    {
      label: 'Light mode',
      fields: [
        {
          kind: 'text',
          key: 'src',
          label: 'Light mode image',
          icon: Link2,
          type: 'url',
          placeholder: 'https://… or /assets/…',
          upload: true,
        },
        {
          kind: 'text',
          key: 'alt',
          label: 'Light mode alt tag',
          icon: Type,
          placeholder: 'Describe what the image shows',
        },
      ],
    },
    {
      label: 'Dark mode',
      fields: [
        {
          kind: 'text',
          key: 'srcDark',
          label: 'Dark mode image',
          description:
            'Optional. When set, the rendered site shows this variant in dark mode.',
          icon: Moon,
          type: 'url',
          placeholder: 'https://… or /assets/…',
          upload: true,
        },
        {
          kind: 'text',
          key: 'altDark',
          label: 'Dark mode alt tag',
          icon: Sun,
          placeholder: 'Describe the dark-mode variant',
        },
      ],
    },
  ],
};
