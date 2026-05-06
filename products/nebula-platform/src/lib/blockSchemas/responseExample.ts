import { ArrowDownLeft, Type } from 'lucide-react';
import type { BlockAttrSchema } from './types';

export const responseExampleSchema: BlockAttrSchema = {
  blockType: 'mdxResponseExample',
  title: 'Edit Response Example',
  headerIcon: ArrowDownLeft,
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
          placeholder: 'Response',
        },
      ],
    },
  ],
};
