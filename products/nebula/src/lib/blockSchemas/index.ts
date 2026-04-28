import type { BlockAttrSchema } from './types';
import { calloutSchema } from './callout';
import { cardSchema } from './card';
import { frameSchema } from './frame';
import { stepSchema } from './step';
import { updateSchema } from './update';

const REGISTRY: Record<string, BlockAttrSchema> = {
  [calloutSchema.blockType]: calloutSchema,
  [cardSchema.blockType]: cardSchema,
  [frameSchema.blockType]: frameSchema,
  [stepSchema.blockType]: stepSchema,
  [updateSchema.blockType]: updateSchema,
};

export function getBlockSchema(blockType: string): BlockAttrSchema | null {
  return REGISTRY[blockType] ?? null;
}

export type { AttrField, BlockAttrSchema, BlockAttrs, IconAttrValue } from './types';
