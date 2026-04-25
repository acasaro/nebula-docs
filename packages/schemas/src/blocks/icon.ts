import { z } from 'zod';
import { blockId, iconLibrary } from './_shared';

export const iconPropsSchema = z.object({
  icon: z.string().min(1),
  color: z.string().optional(),
  size: z.number().int().positive().optional(),
  iconLibrary: iconLibrary.optional(),
});

export const iconBlockSchema = z.object({
  id: blockId,
  type: z.literal('icon'),
  props: iconPropsSchema,
});

export type IconProps = z.infer<typeof iconPropsSchema>;
export type IconBlock = z.infer<typeof iconBlockSchema>;
