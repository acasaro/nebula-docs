import type { ComponentType, ReactNode } from 'react';
import type { Block, BlockType } from '@nebula/schemas';
import { Heading } from './heading/Heading';
import { Text } from './text/Text';
import { CalloutRender } from './callout/Render';
import { IconRender } from './icon/Render';
import { FrameRender } from './frame/Render';
import { VideoRender } from './video/Render';
import { StepRender } from './step/Render';
import { StepsRender } from './steps/Render';

/**
 * Block render components receive:
 *   - `block`: the full block data (including unrendered `children` if any)
 *   - `children`: the already-rendered ReactNode for the block's children,
 *     produced by BlockRenderer's recursion. Most components just pass this
 *     through to whatever wrapper they render.
 *   - `renderChildren`: the same recursion as a callable. Container blocks that
 *     need fine control over how each child slot is rendered (e.g. Steps,
 *     which auto-numbers its child Step blocks) call this directly with
 *     specific child arrays.
 */
export interface BlockComponentProps<B extends Block = Block> {
  block: B;
  children?: ReactNode;
  renderChildren?: (blocks: Block[] | undefined) => ReactNode;
}

export type BlockComponent<B extends Block = Block> = ComponentType<BlockComponentProps<B>>;

export type BlockRegistry = {
  [K in BlockType]: BlockComponent<Extract<Block, { type: K }>>;
};

export const blockRegistry: BlockRegistry = {
  heading: Heading,
  text: Text,
  callout: CalloutRender,
  icon: IconRender,
  frame: FrameRender,
  video: VideoRender,
  step: StepRender,
  steps: StepsRender,
};

export function getBlockComponent<B extends Block>(block: B): BlockComponent<B> {
  return blockRegistry[block.type] as BlockComponent<B>;
}
