import { Columns2 } from 'lucide-react';
import type { BlockAttrSchema } from './types';

const COLS_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

export const columnsSchema: BlockAttrSchema = {
  blockType: 'mdxColumns',
  title: 'Edit Columns',
  headerIcon: Columns2,
  inlinePopover: true,
  sections: [
    {
      label: 'Layout',
      fields: [
        {
          kind: 'select',
          key: 'cols',
          label: 'Columns',
          options: COLS_OPTIONS,
          placeholder: '2 (default)',
        },
      ],
    },
  ],
};
