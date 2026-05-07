import { Film, Link2, Repeat, Type } from 'lucide-react';
import type { BlockAttrSchema } from './types';

export const videoSchema: BlockAttrSchema = {
  blockType: 'mdxVideo',
  title: 'Video options',
  headerIcon: Film,
  inlinePopover: true,
  sections: [
    {
      label: 'Source',
      fields: [
        {
          kind: 'text',
          key: 'src',
          label: 'Video URL',
          icon: Link2,
          type: 'url',
          placeholder: 'https://… or /assets/…',
          upload: true,
          uploadCategory: 'video',
        },
        {
          kind: 'text',
          key: 'caption',
          label: 'Caption',
          icon: Type,
          placeholder: 'Optional caption shown beneath the video',
        },
      ],
    },
    {
      label: 'Playback',
      fields: [
        {
          kind: 'toggle',
          key: 'loop',
          label: 'Loop after playback',
          icon: Repeat,
          description:
            'Replay the clip up to the loop count below before stopping.',
        },
        {
          kind: 'number',
          key: 'maxLoops',
          label: 'Max loops',
          min: 1,
          max: 50,
          step: 1,
          placeholder: '4',
        },
      ],
    },
  ],
};
