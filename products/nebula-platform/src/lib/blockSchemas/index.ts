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
import { mediaCardSchema } from './media-card';
import { paramFieldSchema } from './paramField';
import { profileSchema } from './profile';
import { requestExampleSchema } from './requestExample';
import { responseExampleSchema } from './responseExample';
import { responseFieldSchema } from './responseField';
import { sheetSchema } from './sheet';
import { stageSchema } from './stage';
import { statSchema } from './stat';
import { statsSchema } from './stats';
import { stepSchema } from './step';
import { stepsSchema } from './steps';
import { tabSchema } from './tab';
import { tooltipSchema } from './tooltip';
import { topicCardSchema } from './topic-card';
import { topicLinkSchema } from './topic-link';
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
  [mediaCardSchema.blockType]: mediaCardSchema,
  [paramFieldSchema.blockType]: paramFieldSchema,
  [profileSchema.blockType]: profileSchema,
  [requestExampleSchema.blockType]: requestExampleSchema,
  [responseExampleSchema.blockType]: responseExampleSchema,
  [responseFieldSchema.blockType]: responseFieldSchema,
  [sheetSchema.blockType]: sheetSchema,
  [stageSchema.blockType]: stageSchema,
  [statSchema.blockType]: statSchema,
  [statsSchema.blockType]: statsSchema,
  [stepSchema.blockType]: stepSchema,
  [stepsSchema.blockType]: stepsSchema,
  [tabSchema.blockType]: tabSchema,
  [tooltipSchema.blockType]: tooltipSchema,
  [topicCardSchema.blockType]: topicCardSchema,
  [topicLinkSchema.blockType]: topicLinkSchema,
  [updateSchema.blockType]: updateSchema,
  [videoSchema.blockType]: videoSchema,
};

export function getBlockSchema(blockType: string): BlockAttrSchema | null {
  return REGISTRY[blockType] ?? null;
}

export type { AttrField, BlockAttrSchema, BlockAttrs, IconAttrValue } from './types';
