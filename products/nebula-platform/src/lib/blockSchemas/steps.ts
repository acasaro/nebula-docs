import { ListOrdered } from 'lucide-react';
import type { BlockAttrSchema } from './types';

const TITLE_SIZE_OPTIONS = [
  { value: 'p', label: 'Paragraph' },
  { value: 'h2', label: 'Heading 2' },
  { value: 'h3', label: 'Heading 3' },
  { value: 'h4', label: 'Heading 4' },
] as const;

export const stepsSchema: BlockAttrSchema = {
  blockType: 'mdxSteps',
  title: 'Edit Steps',
  headerIcon: ListOrdered,
  sections: [
    {
      label: 'Appearance',
      fields: [
        {
          kind: 'select',
          key: 'titleSize',
          label: 'Step title size',
          options: TITLE_SIZE_OPTIONS,
          placeholder: 'Inherit (paragraph)',
        },
      ],
    },
  ],
};
