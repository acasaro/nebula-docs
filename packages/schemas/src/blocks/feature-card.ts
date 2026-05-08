import { z } from 'zod';
import { blockId, iconLibrary } from './_shared';
import type { Block } from '../block';
import { blockSchema } from '../block';

export const featureCardColor = z.enum([
  'purple',
  'blue',
  'teal',
  'green',
  'yellow',
  'orange',
  'red',
  'neutral',
]);

export const featureCardAccent = z.enum(['top-bar', 'none']);
export const featureCardLayout = z.enum(['vertical', 'horizontal']);

export const featureCardPropsSchema = z.object({
  color: featureCardColor.optional(),
  accent: featureCardAccent.optional(),
  layout: featureCardLayout.optional(),
  icon: z.string().optional(),
  iconLibrary: iconLibrary.optional(),
  pill: z.string().optional(),
  title: z.string().optional(),
  linkText: z.string().optional(),
  linkUrl: z.string().optional(),
});

export type FeatureCardColor = z.infer<typeof featureCardColor>;
export type FeatureCardPropsSchema = z.infer<typeof featureCardPropsSchema>;

export type FeatureCardBlock = {
  id: string;
  type: 'feature-card';
  props: FeatureCardPropsSchema;
  children?: Block[];
};

export const featureCardBlockSchema = z.object({
  id: blockId,
  type: z.literal('feature-card'),
  props: featureCardPropsSchema,
  children: z.array(z.lazy(() => blockSchema)).optional(),
});
