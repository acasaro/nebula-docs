import { AlignLeft, Hash, Tag } from 'lucide-react';
import type { BlockAttrSchema } from './types';

export const updateSchema: BlockAttrSchema = {
  blockType: 'mdxUpdate',
  title: 'Edit Update',
  headerIcon: Tag,
  sections: [
    {
      label: 'Content',
      fields: [
        {
          kind: 'text',
          key: 'label',
          label: 'Label',
          icon: Tag,
          placeholder: 'e.g. v1.0.0',
        },
        {
          kind: 'text',
          key: 'description',
          label: 'Description',
          icon: AlignLeft,
          placeholder: 'Optional description',
        },
        {
          kind: 'text',
          key: 'tags',
          label: 'Tags',
          icon: Hash,
          placeholder: 'tag1, tag2, tag3 (comma-separated)',
        },
      ],
    },
  ],
};
