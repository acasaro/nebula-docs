import { AlignLeft, ChevronDown, PanelTopOpen, Type } from 'lucide-react';
import type { BlockAttrSchema } from './types';

export const accordionSchema: BlockAttrSchema = {
  blockType: 'mdxAccordion',
  title: 'Edit Accordion',
  headerIcon: PanelTopOpen,
  sections: [
    {
      label: 'Content',
      fields: [
        {
          kind: 'text',
          key: 'title',
          label: 'Title',
          icon: Type,
          placeholder: 'Accordion title',
        },
        {
          kind: 'text',
          key: 'description',
          label: 'Description',
          icon: AlignLeft,
          placeholder: 'Optional secondary text',
        },
      ],
    },
    {
      label: 'Icon',
      fields: [
        {
          kind: 'icon',
          key: 'icon',
          libraryKey: 'iconLibrary',
          typeKey: 'iconType',
          label: 'Select icon',
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
