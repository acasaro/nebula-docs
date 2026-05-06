import { ArrowUpRight, Type } from 'lucide-react';
import type { BlockAttrSchema } from './types';

export const requestExampleSchema: BlockAttrSchema = {
  blockType: 'mdxRequestExample',
  title: 'Edit Request Example',
  headerIcon: ArrowUpRight,
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
          placeholder: 'Request',
        },
      ],
    },
  ],
};
