import type { BlockAttrSchema } from './types';
import { accordionGroupSchema, accordionSchema } from './accordion';
import { calloutSchema } from './callout';
import { cardSchema } from './card';
import { columnsSchema } from './columns';
import { expandableSchema } from './expandable';
import { frameSchema } from './frame';
import { stepSchema } from './step';
import { tabSchema, tabsSchema } from './tabs';
import { updateSchema } from './update';

const REGISTRY: Record<string, BlockAttrSchema> = {
  [accordionSchema.blockType]: accordionSchema,
  [accordionGroupSchema.blockType]: accordionGroupSchema,
  [calloutSchema.blockType]: calloutSchema,
  [cardSchema.blockType]: cardSchema,
  [columnsSchema.blockType]: columnsSchema,
  [expandableSchema.blockType]: expandableSchema,
  [frameSchema.blockType]: frameSchema,
  [stepSchema.blockType]: stepSchema,
  [tabSchema.blockType]: tabSchema,
  [tabsSchema.blockType]: tabsSchema,
  [updateSchema.blockType]: updateSchema,
};

export function getBlockSchema(blockType: string): BlockAttrSchema | null {
  return REGISTRY[blockType] ?? null;
}

export type { AttrField, BlockAttrSchema, BlockAttrs, IconAttrValue } from './types';
