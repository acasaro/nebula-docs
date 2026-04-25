import type { ComponentType, ReactNode } from 'react';
import type { Block, BlockType } from '@mcoe/schemas';
import { Heading } from './heading/Heading';
import { Text } from './text/Text';
import { Callout } from './callout/Callout';

export interface BlockComponentProps<B extends Block = Block> {
  block: B;
  children?: ReactNode;
}

export type BlockComponent<B extends Block = Block> = ComponentType<BlockComponentProps<B>>;

export type BlockRegistry = {
  [K in BlockType]: BlockComponent<Extract<Block, { type: K }>>;
};

export const blockRegistry: BlockRegistry = {
  heading: Heading,
  text: Text,
  callout: Callout,
};

export function getBlockComponent<B extends Block>(block: B): BlockComponent<B> {
  return blockRegistry[block.type] as BlockComponent<B>;
}
