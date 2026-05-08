import { Link as LinkIcon, Type } from 'lucide-react';
import type { BlockAttrSchema } from './types';

export const topicLinkSchema: BlockAttrSchema = {
  blockType: 'mdxTopicLink',
  title: 'Edit Topic Link',
  headerIcon: LinkIcon,
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
          placeholder: 'Link label',
        },
        {
          kind: 'text',
          key: 'href',
          label: 'URL',
          icon: LinkIcon,
          placeholder: 'https://…',
          type: 'url',
        },
      ],
    },
  ],
};
