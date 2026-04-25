import type { ComponentType } from 'react';
import type { Block, BlockType } from '@mcoe/schemas';
import { HeadingEditForm } from './HeadingEditForm';
import { TextEditForm } from './TextEditForm';
import { CalloutEditForm } from './CalloutEditForm';
import { IconEditForm } from './IconEditForm';
import { FrameEditForm } from './FrameEditForm';
import { VideoEditForm } from './VideoEditForm';
import { StepEditForm } from './StepEditForm';
import { StepsEditForm } from './StepsEditForm';

export interface BlockEditFormProps<B extends Block = Block> {
  block: B;
  onChange: (block: B) => void;
}

export type BlockEditFormComponent<B extends Block = Block> = ComponentType<
  BlockEditFormProps<B>
>;

type EditFormRegistry = {
  [K in BlockType]: BlockEditFormComponent<Extract<Block, { type: K }>>;
};

export const editFormRegistry: EditFormRegistry = {
  heading: HeadingEditForm,
  text: TextEditForm,
  callout: CalloutEditForm,
  icon: IconEditForm,
  frame: FrameEditForm,
  video: VideoEditForm,
  step: StepEditForm,
  steps: StepsEditForm,
};

export function getEditForm<B extends Block>(
  block: B
): BlockEditFormComponent<B> {
  return editFormRegistry[block.type] as BlockEditFormComponent<B>;
}

export function newBlockOfType(type: BlockType): Block {
  const id = crypto.randomUUID();
  switch (type) {
    case 'heading':
      return { id, type: 'heading', props: { level: 2, text: 'New heading' } };
    case 'text':
      return { id, type: 'text', props: { markdown: '' } };
    case 'callout':
      return { id, type: 'callout', props: { variant: 'note' } };
    case 'icon':
      return { id, type: 'icon', props: { icon: 'info' } };
    case 'frame':
      return { id, type: 'frame', props: {} };
    case 'video':
      return { id, type: 'video', props: { src: '' } };
    case 'step':
      return { id, type: 'step', props: { title: 'New step' } };
    case 'steps':
      return { id, type: 'steps', props: {} };
  }
}
