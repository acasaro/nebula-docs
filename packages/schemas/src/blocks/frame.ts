import { z } from 'zod';
import { blockId } from './_shared';
import type { Block } from '../block';
import { blockSchema } from '../block';

export const framePropsSchema = z.object({
  caption: z.string().optional(),
});

export type FrameProps = z.infer<typeof framePropsSchema>;

export type FrameBlock = {
  id: string;
  type: 'frame';
  props: FrameProps;
  children?: Block[];
};

export const frameBlockSchema = z.object({
  id: blockId,
  type: z.literal('frame'),
  props: framePropsSchema,
  children: z.array(z.lazy(() => blockSchema)).optional(),
});
