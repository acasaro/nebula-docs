import { z } from 'zod';
import { blockId } from './_shared';

export const videoPropsSchema = z.object({
  src: z.string().min(1),
  caption: z.string().optional(),
  loop: z.boolean().optional(),
  maxLoops: z.number().int().positive().optional(),
});

export const videoBlockSchema = z.object({
  id: blockId,
  type: z.literal('video'),
  props: videoPropsSchema,
});

export type VideoProps = z.infer<typeof videoPropsSchema>;
export type VideoBlock = z.infer<typeof videoBlockSchema>;
