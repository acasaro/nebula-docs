import { z } from 'zod';

export const blockId = z.string().uuid();

export const headingLevel = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
]);

export const calloutVariant = z.enum(['info', 'check', 'tip', 'warning', 'danger']);
