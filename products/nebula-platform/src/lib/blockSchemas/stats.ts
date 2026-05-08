import { Columns3, LayoutGrid } from 'lucide-react';
import type { BlockAttrSchema } from './types';

export const statsSchema: BlockAttrSchema = {
  blockType: 'mdxStats',
  title: 'Edit Stats',
  headerIcon: LayoutGrid,
  inlinePopover: true,
  sections: [
    {
      label: 'Layout',
      fields: [
        {
          kind: 'number',
          key: 'columns',
          label: 'Columns',
          icon: Columns3,
          placeholder: 'Auto-fit',
          min: 1,
          max: 12,
          step: 1,
        },
      ],
    },
  ],
};
