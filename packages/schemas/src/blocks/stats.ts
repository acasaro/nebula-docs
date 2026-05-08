import { z } from 'zod';
import { blockId } from './_shared';
import { statBlockSchema } from './stat';

export const statsPropsSchema = z.object({
  columns: z.number().int().positive().optional(),
});

export type StatsPropsSchema = z.infer<typeof statsPropsSchema>;

export type StatsBlock = {
  id: string;
  type: 'stats';
  props: StatsPropsSchema;
  children?: Array<z.infer<typeof statBlockSchema>>;
};

export const statsBlockSchema = z.object({
  id: blockId,
  type: z.literal('stats'),
  props: statsPropsSchema,
  children: z.array(statBlockSchema).optional(),
});
