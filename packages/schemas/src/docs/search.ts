import { z } from 'zod';

export const SEARCH_PROVIDERS = ['pagefind'] as const;
export type SearchProvider = (typeof SEARCH_PROVIDERS)[number];

export const SEARCH_SCOPES = ['tab', 'page', 'none'] as const;
export type SearchScope = (typeof SEARCH_SCOPES)[number];

export const searchConfigSchema = z.object({
  provider: z.enum(SEARCH_PROVIDERS).default('pagefind'),
  scopeBy: z.enum(SEARCH_SCOPES).default('tab'),
});
export type SearchConfig = z.infer<typeof searchConfigSchema>;
