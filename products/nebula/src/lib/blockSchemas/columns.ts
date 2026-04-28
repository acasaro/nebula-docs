import { Columns3 } from 'lucide-react';
import type { BlockAttrSchema } from './types';

const COLS_OPTIONS = [
  { value: '1', label: '1 Column' },
  { value: '2', label: '2 Columns' },
  { value: '3', label: '3 Columns' },
  { value: '4', label: '4 Columns' },
] as const;

export const columnsSchema: BlockAttrSchema = {
  blockType: 'mdxColumns',
  title: 'Edit Columns',
  headerIcon: Columns3,
  sections: [
    {
      label: 'Layout',
      fields: [
        {
          kind: 'select',
          key: 'cols',
          label: 'Columns',
          options: COLS_OPTIONS,
          placeholder: '2 Columns',
        },
      ],
    },
  ],
};
