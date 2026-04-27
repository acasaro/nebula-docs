import { AlignLeft, Frame as FrameIcon, Type } from 'lucide-react';
import type { BlockAttrSchema } from './types';

export const frameSchema: BlockAttrSchema = {
  blockType: 'mdxFrame',
  title: 'Edit Frame',
  headerIcon: FrameIcon,
  sections: [
    {
      label: 'Content',
      fields: [
        {
          kind: 'text',
          key: 'title',
          label: 'Title',
          icon: Type,
          placeholder: 'Frame title (optional)',
        },
        {
          kind: 'text',
          key: 'caption',
          label: 'Caption',
          icon: AlignLeft,
          placeholder: 'Caption beneath frame (optional)',
        },
      ],
    },
  ],
};
