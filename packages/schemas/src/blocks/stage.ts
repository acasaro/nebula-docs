import { z } from 'zod';
import { blockId } from './_shared';

export const stageStatus = z.enum(['done', 'active', 'pending', 'blocked']);

export const stagePropsSchema = z.object({
  label: z.string().optional(),
  status: stageStatus.optional(),
  meta: z.string().optional(),
});

export type StageStatus = z.infer<typeof stageStatus>;
export type StagePropsSchema = z.infer<typeof stagePropsSchema>;

export type StageBlock = {
  id: string;
  type: 'stage';
  props: StagePropsSchema;
};

export const stageBlockSchema = z.object({
  id: blockId,
  type: z.literal('stage'),
  props: stagePropsSchema,
});
