import { z } from 'zod';
import { headingBlockSchema, type HeadingBlock } from './blocks/heading';
import { textBlockSchema, type TextBlock } from './blocks/text';
import { calloutBlockSchema, type CalloutBlock } from './blocks/callout';
import { iconBlockSchema, type IconBlock } from './blocks/icon';
import { frameBlockSchema, type FrameBlock } from './blocks/frame';
import { videoBlockSchema, type VideoBlock } from './blocks/video';
import { stepBlockSchema, type StepBlock } from './blocks/step';
import { stepsBlockSchema, type StepsBlock } from './blocks/steps';

export type Block =
  | HeadingBlock
  | TextBlock
  | CalloutBlock
  | IconBlock
  | FrameBlock
  | VideoBlock
  | StepBlock
  | StepsBlock;

export type BlockType = Block['type'];

export const blockSchema: z.ZodType<Block> = z.lazy(() =>
  z.discriminatedUnion('type', [
    headingBlockSchema,
    textBlockSchema,
    calloutBlockSchema,
    iconBlockSchema,
    frameBlockSchema,
    videoBlockSchema,
    stepBlockSchema,
    stepsBlockSchema,
  ])
) as z.ZodType<Block>;
