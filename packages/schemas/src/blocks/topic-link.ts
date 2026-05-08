import { z } from 'zod';
import { blockId } from './_shared';

export const topicLinkPropsSchema = z.object({
  label: z.string().optional(),
  href: z.string().optional(),
});

export type TopicLinkPropsSchema = z.infer<typeof topicLinkPropsSchema>;

export type TopicLinkBlock = {
  id: string;
  type: 'topic-link';
  props: TopicLinkPropsSchema;
};

export const topicLinkBlockSchema = z.object({
  id: blockId,
  type: z.literal('topic-link'),
  props: topicLinkPropsSchema,
});
