import { z } from 'zod';
import {
  headingBlockSchema,
  type HeadingBlock,
} from './blocks/heading';
import {
  textBlockSchema,
  type TextBlock,
} from './blocks/text';
import {
  calloutBlockSchema,
  type CalloutBlock,
} from './blocks/callout';

export type Block = HeadingBlock | TextBlock | CalloutBlock;

export type BlockType = Block['type'];

export const blockSchema: z.ZodType<Block> = z.lazy(() =>
  z.discriminatedUnion('type', [
    headingBlockSchema,
    textBlockSchema,
    calloutBlockSchema,
  ])
) as z.ZodType<Block>;
