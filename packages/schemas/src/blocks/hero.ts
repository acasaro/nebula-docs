import { z } from 'zod';
import { blockId } from './_shared';

export const heroVariantSchema = z.enum(['banner', 'compact', 'split']);

export const heroActionSchema = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  style: z.enum(['primary', 'secondary']).optional(),
});

export const heroSlideSchema = z.object({
  eyebrow: z.string().optional(),
  title: z.string().optional(),
  accent: z.string().optional(),
  description: z.string().optional(),
  actions: z.array(heroActionSchema).optional(),
  background: z.string().optional(),
  textColor: z.string().optional(),
  accentColor: z.string().optional(),
  secondaryTitle: z.string().optional(),
  secondaryDescription: z.string().optional(),
  sideImage: z.string().optional(),
  sideImageAlt: z.string().optional(),
});

export const heroPropsSchema = z
  .object({
    variant: heroVariantSchema.optional(),
    slides: z.array(heroSlideSchema).optional(),
    interval: z.number().int().positive().optional(),
    padded: z.boolean().optional(),
  })
  // Top-level single-slide fields are merged in for back-compat with the
  // shorthand authoring form (`<Hero title="..." />`).
  .merge(heroSlideSchema);

export const heroBlockSchema = z.object({
  id: blockId,
  type: z.literal('hero'),
  props: heroPropsSchema,
});

export type HeroVariant = z.infer<typeof heroVariantSchema>;
export type HeroAction = z.infer<typeof heroActionSchema>;
export type HeroSlide = z.infer<typeof heroSlideSchema>;
export type HeroProps = z.infer<typeof heroPropsSchema>;
export type HeroBlock = z.infer<typeof heroBlockSchema>;
