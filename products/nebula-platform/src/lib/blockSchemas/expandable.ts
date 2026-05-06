import { ChevronDown, Eye, EyeOff, Maximize2, Type } from 'lucide-react';
import type { BlockAttrSchema } from './types';

export const expandableSchema: BlockAttrSchema = {
  blockType: 'mdxExpandable',
  title: 'Edit Expandable',
  headerIcon: Maximize2,
  sections: [
    {
      label: 'Content',
      fields: [
        {
          kind: 'text',
          key: 'title',
          label: 'Subject',
          icon: Type,
          placeholder: 'child attributes',
        },
      ],
    },
    {
      label: 'Labels',
      fields: [
        {
          kind: 'text',
          key: 'closedText',
          label: 'Closed text',
          icon: Eye,
          placeholder: 'Show',
        },
        {
          kind: 'text',
          key: 'openedText',
          label: 'Open text',
          icon: EyeOff,
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
          label: 'Open by default',
          icon: ChevronDown,
        },
      ],
    },
  ],
};
