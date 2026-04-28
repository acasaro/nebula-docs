import { Hash, PanelTop } from 'lucide-react';
import type { BlockAttrSchema } from './types';

export const tabsSchema: BlockAttrSchema = {
  blockType: 'mdxTabs',
  title: 'Edit Tabs',
  headerIcon: PanelTop,
  sections: [
    {
      label: 'Behavior',
      fields: [
        {
          kind: 'text',
          key: 'defaultTabIndex',
          label: 'Default Tab Index',
          icon: Hash,
          placeholder: '0',
        },
        {
          kind: 'text',
          key: 'ariaLabel',
          label: 'ARIA Label',
          placeholder: 'Tabs',
        },
      ],
    },
  ],
};

export const tabSchema: BlockAttrSchema = {
  blockType: 'mdxTab',
  title: 'Edit Tab',
  headerIcon: PanelTop,
  sections: [
    {
      label: 'Identity',
      fields: [
        {
          kind: 'text',
          key: 'id',
          label: 'Anchor ID',
          icon: Hash,
          placeholder: 'Optional',
        },
      ],
    },
  ],
};
