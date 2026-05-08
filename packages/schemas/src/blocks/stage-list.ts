import { z } from 'zod';
import { blockId } from './_shared';
import { stageBlockSchema } from './stage';

export const stageListPropsSchema = z.object({});

export type StageListPropsSchema = z.infer<typeof stageListPropsSchema>;

export type StageListBlock = {
  id: string;
  type: 'stage-list';
  props: StageListPropsSchema;
  children?: Array<z.infer<typeof stageBlockSchema>>;
};

export const stageListBlockSchema = z.object({
  id: blockId,
  type: z.literal('stage-list'),
  props: stageListPropsSchema,
  children: z.array(stageBlockSchema).optional(),
});
