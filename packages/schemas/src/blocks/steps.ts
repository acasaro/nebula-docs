import { z } from 'zod';
import { blockId, titleSize } from './_shared';
import type { Block } from '../block';
import { blockSchema } from '../block';

export const stepsPropsSchema = z.object({
  titleSize: titleSize.optional(),
});

export type StepsProps = z.infer<typeof stepsPropsSchema>;

export type StepsBlock = {
  id: string;
  type: 'steps';
  props: StepsProps;
  children?: Block[];
};

export const stepsBlockSchema = z.object({
  id: blockId,
  type: z.literal('steps'),
  props: stepsPropsSchema,
  children: z.array(z.lazy(() => blockSchema)).optional(),
});
