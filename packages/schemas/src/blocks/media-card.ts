import { z } from 'zod';
import { blockId } from './_shared';

export const mediaCardCategoryColor = z.enum([
  'purple',
  'blue',
  'teal',
  'green',
  'yellow',
  'orange',
  'red',
  'neutral',
]);

export const mediaCardPropsSchema = z.object({
  image: z.string().optional(),
  imageAlt: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  href: z.string().optional(),
  category: z.string().optional(),
  categoryColor: mediaCardCategoryColor.optional(),
});

export type MediaCardCategoryColor = z.infer<typeof mediaCardCategoryColor>;
export type MediaCardPropsSchema = z.infer<typeof mediaCardPropsSchema>;

export type MediaCardBlock = {
  id: string;
  type: 'media-card';
  props: MediaCardPropsSchema;
};

export const mediaCardBlockSchema = z.object({
  id: blockId,
  type: z.literal('media-card'),
  props: mediaCardPropsSchema,
});
