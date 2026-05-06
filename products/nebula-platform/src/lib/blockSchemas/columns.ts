import { Columns2 } from 'lucide-react';
import type { BlockAttrSchema } from './types';

const COLS_OPTIONS = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
] as const;

export const columnsSchema: BlockAttrSchema = {
  blockType: 'mdxColumns',
  title: 'Edit Columns',
  headerIcon: Columns2,
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
