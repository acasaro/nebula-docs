import { z } from 'zod';
import { blockId, iconLibrary, titleSize } from './_shared';
import type { Block } from '../block';
import { blockSchema } from '../block';

export const stepPropsSchema = z.object({
  title: z.string().min(1),
  titleSize: titleSize.optional(),
  icon: z.string().optional(),
  iconLibrary: iconLibrary.optional(),
});

export type StepProps = z.infer<typeof stepPropsSchema>;

export type StepBlock = {
  id: string;
  type: 'step';
  props: StepProps;
  children?: Block[];
};

export const stepBlockSchema = z.object({
  id: blockId,
  type: z.literal('step'),
  props: stepPropsSchema,
  children: z.array(z.lazy(() => blockSchema)).optional(),
});
