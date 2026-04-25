import { z } from 'zod';
import { blockId, headingLevel } from './_shared';

export const headingPropsSchema = z.object({
  level: headingLevel,
  text: z.string().min(1),
  anchor: z.string().optional(),
});

export const headingBlockSchema = z.object({
  id: blockId,
  type: z.literal('heading'),
  props: headingPropsSchema,
});

export type HeadingProps = z.infer<typeof headingPropsSchema>;
export type HeadingBlock = z.infer<typeof headingBlockSchema>;
