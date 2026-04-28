import { ChevronsUpDown, Eye, EyeOff, ToggleRight, Type } from 'lucide-react';
import type { BlockAttrSchema } from './types';

export const expandableSchema: BlockAttrSchema = {
  blockType: 'mdxExpandable',
  title: 'Edit Expandable',
  headerIcon: ChevronsUpDown,
  sections: [
    {
      label: 'Labels',
      fields: [
        {
          kind: 'text',
          key: 'title',
          label: 'Title',
          icon: Type,
          placeholder: 'child attributes',
        },
        {
          kind: 'text',
          key: 'closedText',
          label: 'Closed Text',
          icon: EyeOff,
          placeholder: 'Show',
        },
        {
          kind: 'text',
          key: 'openedText',
          label: 'Opened Text',
          icon: Eye,
          placeholder: 'Hide',
        },
      ],
    },
    {
      label: 'Behavior',
      fields: [
        {
          kind: 'toggle',
          key: 'defaultOpen',
          label: 'Default Open',
          icon: ToggleRight,
        },
      ],
    },
  ],
};
