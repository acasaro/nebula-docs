import type { ComponentType } from 'react';
import type { Block, BlockType } from '@mcoe/schemas';
import { HeadingEditForm } from './HeadingEditForm';
import { TextEditForm } from './TextEditForm';
import { CalloutEditForm } from './CalloutEditForm';

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
      return { id, type: 'callout', props: { variant: 'info' } };
  }
}
