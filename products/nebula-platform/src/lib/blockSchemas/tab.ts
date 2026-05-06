import { Hash, LayoutPanelTop, Type } from 'lucide-react';
import type { BlockAttrSchema } from './types';

export const tabSchema: BlockAttrSchema = {
  blockType: 'mdxTab',
  title: 'Edit Tab',
  headerIcon: LayoutPanelTop,
  inlinePopover: true,
  sections: [
    {
      label: 'Content',
      fields: [
        {
          kind: 'text',
          key: 'title',
          label: 'Tab title',
          icon: Type,
          placeholder: 'Tab',
        },
        {
          kind: 'text',
          key: 'id',
          label: 'ID',
          icon: Hash,
          placeholder: 'Optional anchor id',
        },
      ],
    },
  ],
};
