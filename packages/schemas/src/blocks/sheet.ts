import { z } from 'zod';
import { blockId, iconLibrary } from './_shared';
import type { Block } from '../block';
import { blockSchema } from '../block';

export const sheetColor = z.enum([
  'purple',
  'blue',
  'teal',
  'green',
  'yellow',
  'orange',
  'red',
  'neutral',
]);

export const sheetPropsSchema = z.object({
  color: sheetColor.optional(),
  label: z.string().optional(),
  icon: z.string().optional(),
  iconLibrary: iconLibrary.optional(),
});

export type SheetColor = z.infer<typeof sheetColor>;
export type SheetPropsSchema = z.infer<typeof sheetPropsSchema>;

export type SheetBlock = {
  id: string;
  type: 'sheet';
  props: SheetPropsSchema;
  children?: Block[];
};

export const sheetBlockSchema = z.object({
  id: blockId,
  type: z.literal('sheet'),
  props: sheetPropsSchema,
  children: z.array(z.lazy(() => blockSchema)).optional(),
});
