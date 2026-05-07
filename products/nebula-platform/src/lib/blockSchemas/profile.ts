import {
  Briefcase,
  Image as ImageIcon,
  Link2,
  Palette,
  Type,
  User,
} from 'lucide-react';
import type { BlockAttrSchema } from './types';

export const profileSchema: BlockAttrSchema = {
  blockType: 'mdxProfile',
  title: 'Profile options',
  headerIcon: User,
  inlinePopover: true,
  sections: [
    {
      label: 'Identity',
      fields: [
        {
          kind: 'text',
          key: 'name',
          label: 'Name',
          icon: Type,
          placeholder: 'Jane Doe',
        },
        {
          kind: 'text',
          key: 'title',
          label: 'Title',
          icon: Briefcase,
          placeholder: 'Senior Engineer',
        },
        {
          kind: 'text',
          key: 'href',
          label: 'Link URL',
          icon: Link2,
          type: 'url',
          placeholder: 'https://…',
        },
      ],
    },
    {
      label: 'Photo',
      fields: [
        {
          kind: 'text',
          key: 'photo',
          label: 'Photo URL',
          icon: ImageIcon,
          type: 'url',
          placeholder: 'https://… or /assets/…',
          upload: true,
          uploadCategory: 'image',
        },
        {
          kind: 'text',
          key: 'initials',
          label: 'Fallback initials',
          icon: Type,
          placeholder: 'Auto-derived from name',
        },
        {
          kind: 'text',
          key: 'accent',
          label: 'Fallback accent color',
          icon: Palette,
          placeholder: 'CSS color (e.g. #4f46e5)',
        },
      ],
    },
  ],
};
