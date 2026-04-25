import { z } from 'zod';
import { blockId } from './_shared';

export const textPropsSchema = z.object({
  markdown: z.string(),
});

export const textBlockSchema = z.object({
  id: blockId,
  type: z.literal('text'),
  props: textPropsSchema,
});

export type TextProps = z.infer<typeof textPropsSchema>;
export type TextBlock = z.infer<typeof textBlockSchema>;
