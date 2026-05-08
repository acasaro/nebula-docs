import type { BlockAttrSchema } from './types';
import { accordionSchema } from './accordion';
import { badgeSchema } from './badge';
import { calloutSchema } from './callout';
import { cardSchema } from './card';
import { cardGroupSchema } from './cardGroup';
import { columnsSchema } from './columns';
import { expandableSchema } from './expandable';
import { featureCardSchema } from './feature-card';
import { featureCardGroupSchema } from './feature-card-group';
import { frameSchema } from './frame';
import { imageSchema } from './image';
import { paramFieldSchema } from './paramField';
import { profileSchema } from './profile';
import { requestExampleSchema } from './requestExample';
import { responseExampleSchema } from './responseExample';
import { responseFieldSchema } from './responseField';
import { sheetSchema } from './sheet';
import { stageListSchema } from './stage-list';
import { stageSchema } from './stage';
import { stepSchema } from './step';
import { stepsSchema } from './steps';
import { tabSchema } from './tab';
import { tooltipSchema } from './tooltip';
import { updateSchema } from './update';
import { videoSchema } from './video';

const REGISTRY: Record<string, BlockAttrSchema> = {
  [accordionSchema.blockType]: accordionSchema,
  [badgeSchema.blockType]: badgeSchema,
  [calloutSchema.blockType]: calloutSchema,
  [cardSchema.blockType]: cardSchema,
  [cardGroupSchema.blockType]: cardGroupSchema,
  [columnsSchema.blockType]: columnsSchema,
  [expandableSchema.blockType]: expandableSchema,
  [featureCardSchema.blockType]: featureCardSchema,
  [featureCardGroupSchema.blockType]: featureCardGroupSchema,
  [frameSchema.blockType]: frameSchema,
  [imageSchema.blockType]: imageSchema,
  [paramFieldSchema.blockType]: paramFieldSchema,
  [profileSchema.blockType]: profileSchema,
  [requestExampleSchema.blockType]: requestExampleSchema,
  [responseExampleSchema.blockType]: responseExampleSchema,
  [responseFieldSchema.blockType]: responseFieldSchema,
  [sheetSchema.blockType]: sheetSchema,
  [stageListSchema.blockType]: stageListSchema,
  [stageSchema.blockType]: stageSchema,
  [stepSchema.blockType]: stepSchema,
  [stepsSchema.blockType]: stepsSchema,
  [tabSchema.blockType]: tabSchema,
  [tooltipSchema.blockType]: tooltipSchema,
  [updateSchema.blockType]: updateSchema,
  [videoSchema.blockType]: videoSchema,
};

export function getBlockSchema(blockType: string): BlockAttrSchema | null {
  return REGISTRY[blockType] ?? null;
}

export type { AttrField, BlockAttrSchema, BlockAttrs, IconAttrValue } from './types';
