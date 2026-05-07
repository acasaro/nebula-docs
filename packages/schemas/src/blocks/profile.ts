import { z } from 'zod';
import { blockId } from './_shared';

export const profilePropsSchema = z.object({
  name: z.string().min(1),
  title: z.string().optional(),
  photo: z.string().optional(),
  href: z.string().optional(),
  initials: z.string().optional(),
  accent: z.string().optional(),
});

export const profileBlockSchema = z.object({
  id: blockId,
  type: z.literal('profile'),
  props: profilePropsSchema,
});

export type ProfileProps = z.infer<typeof profilePropsSchema>;
export type ProfileBlock = z.infer<typeof profileBlockSchema>;
