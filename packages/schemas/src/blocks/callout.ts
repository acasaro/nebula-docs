import { z } from 'zod';
import { blockId, calloutVariant, iconLibrary } from './_shared';
import type { Block } from '../block';
import { blockSchema } from '../block';

export const calloutPropsSchema = z.object({
  variant: calloutVariant.optional(),
  title: z.string().optional(),
  icon: z.string().optional(),
  iconLibrary: iconLibrary.optional(),
  color: z.string().optional(),
});

export type CalloutProps = z.infer<typeof calloutPropsSchema>;

export type CalloutBlock = {
  id: string;
  type: 'callout';
  props: CalloutProps;
  children?: Block[];
};

export const calloutBlockSchema = z.object({
  id: blockId,
  type: z.literal('callout'),
  props: calloutPropsSchema,
  children: z.array(z.lazy(() => blockSchema)).optional(),
});
