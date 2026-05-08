import { LayoutGrid, Maximize2, Move } from 'lucide-react';
import type { BlockAttrSchema } from './types';

export const featureCardGroupSchema: BlockAttrSchema = {
  blockType: 'mdxFeatureCardGroup',
  title: 'Edit Feature Card Group',
  headerIcon: LayoutGrid,
  inlinePopover: true,
  sections: [
    {
      label: 'Layout',
      fields: [
        {
          kind: 'text',
          key: 'minWidth',
          label: 'Min card width',
          icon: Maximize2,
          placeholder: '260px',
        },
        {
          kind: 'text',
          key: 'gap',
          label: 'Gap',
          icon: Move,
          placeholder: '1rem',
        },
      ],
    },
  ],
};
