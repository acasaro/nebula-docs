import { z } from 'zod';
import { blockId } from './_shared';

export const statColor = z.enum([
  'purple',
  'blue',
  'teal',
  'green',
  'yellow',
  'orange',
  'red',
  'neutral',
]);

export const statPropsSchema = z.object({
  value: z.string().optional(),
  label: z.string().optional(),
  color: statColor.optional(),
});

export type StatColor = z.infer<typeof statColor>;
export type StatPropsSchema = z.infer<typeof statPropsSchema>;

export type StatBlock = {
  id: string;
  type: 'stat';
  props: StatPropsSchema;
};

export const statBlockSchema = z.object({
  id: blockId,
  type: z.literal('stat'),
  props: statPropsSchema,
});
