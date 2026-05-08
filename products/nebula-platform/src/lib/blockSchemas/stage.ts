import { Activity, Type } from 'lucide-react';
import type { BlockAttrSchema } from './types';

const STATUS_OPTIONS = [
  { value: 'done', label: 'Done' },
  { value: 'active', label: 'Active' },
  { value: 'pending', label: 'Pending' },
  { value: 'blocked', label: 'Blocked' },
] as const;

export const stageSchema: BlockAttrSchema = {
  blockType: 'mdxStage',
  title: 'Edit Stage',
  headerIcon: Activity,
  inlinePopover: true,
  sections: [
    {
      label: 'Content',
      fields: [
        {
          kind: 'text',
          key: 'label',
          label: 'Label',
          icon: Type,
          placeholder: 'Stage label',
        },
        {
          kind: 'select',
          key: 'status',
          label: 'Status',
          icon: Activity,
          options: STATUS_OPTIONS,
        },
        {
          kind: 'text',
          key: 'meta',
          label: 'Meta',
          icon: Type,
          placeholder: 'Right-side text (optional)',
        },
      ],
    },
  ],
};
