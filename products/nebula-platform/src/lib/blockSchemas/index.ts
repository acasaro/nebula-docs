import type { BlockAttrSchema } from './types';
import { accordionSchema } from './accordion';
import { badgeSchema } from './badge';
import { calloutSchema } from './callout';
import { cardSchema } from './card';
import { cardGroupSchema } from './cardGroup';
import { columnsSchema } from './columns';
import { expandableSchema } from './expandable';
import { frameSchema } from './frame';
import { paramFieldSchema } from './paramField';
import { requestExampleSchema } from './requestExample';
import { responseExampleSchema } from './responseExample';
import { responseFieldSchema } from './responseField';
import { stepSchema } from './step';
import { stepsSchema } from './steps';
import { updateSchema } from './update';

const REGISTRY: Record<string, BlockAttrSchema> = {
  [accordionSchema.blockType]: accordionSchema,
  [badgeSchema.blockType]: badgeSchema,
  [calloutSchema.blockType]: calloutSchema,
  [cardSchema.blockType]: cardSchema,
  [cardGroupSchema.blockType]: cardGroupSchema,
  [columnsSchema.blockType]: columnsSchema,
  [expandableSchema.blockType]: expandableSchema,
  [frameSchema.blockType]: frameSchema,
  [paramFieldSchema.blockType]: paramFieldSchema,
  [requestExampleSchema.blockType]: requestExampleSchema,
  [responseExampleSchema.blockType]: responseExampleSchema,
  [responseFieldSchema.blockType]: responseFieldSchema,
  [stepSchema.blockType]: stepSchema,
  [stepsSchema.blockType]: stepsSchema,
  [updateSchema.blockType]: updateSchema,
};

export function getBlockSchema(blockType: string): BlockAttrSchema | null {
  return REGISTRY[blockType] ?? null;
}

export type { AttrField, BlockAttrSchema, BlockAttrs, IconAttrValue } from './types';
