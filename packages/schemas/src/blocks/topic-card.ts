import { z } from 'zod';
import { blockId } from './_shared';
import { topicLinkBlockSchema } from './topic-link';

export const topicCardColor = z.enum([
  'purple',
  'blue',
  'teal',
  'green',
  'yellow',
  'orange',
  'red',
  'neutral',
]);

export const topicCardPropsSchema = z.object({
  color: topicCardColor.optional(),
  icon: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  viewAllHref: z.string().optional(),
});

export type TopicCardColor = z.infer<typeof topicCardColor>;
export type TopicCardPropsSchema = z.infer<typeof topicCardPropsSchema>;

export type TopicCardBlock = {
  id: string;
  type: 'topic-card';
  props: TopicCardPropsSchema;
  children?: Array<z.infer<typeof topicLinkBlockSchema>>;
};

export const topicCardBlockSchema = z.object({
  id: blockId,
  type: z.literal('topic-card'),
  props: topicCardPropsSchema,
  children: z.array(topicLinkBlockSchema).optional(),
});
