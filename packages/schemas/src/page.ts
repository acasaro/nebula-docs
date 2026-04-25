import { z } from 'zod';
import { blockSchema } from './block';

export const SPACE_IDS = ['developers', 'product', 'resources', 'about'] as const;
export type SpaceId = (typeof SPACE_IDS)[number];
export const spaceIdSchema = z.enum(SPACE_IDS);

export const pageStatusSchema = z.enum(['draft', 'published']);
export type PageStatus = z.infer<typeof pageStatusSchema>;

export const lockSchema = z
  .object({
    uid: z.string(),
    name: z.string(),
    expiresAt: z.number().int(),
  })
  .nullable();
export type Lock = z.infer<typeof lockSchema>;

export const pageSchema = z.object({
  id: z.string().uuid(),
  spaceId: spaceIdSchema,
  slug: z.string().min(1),
  title: z.string().min(1),
  status: pageStatusSchema,
  parentId: z.string().uuid().nullable(),
  sidebarOrder: z.number().int().nonnegative(),
  blocks: z.array(blockSchema),
  publishedBlocks: z.array(blockSchema),
  lockedBy: lockSchema,
  updatedAt: z.number().int(),
  updatedBy: z.string(),
  version: z.number().int().nonnegative(),
});
export type Page = z.infer<typeof pageSchema>;
