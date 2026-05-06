import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { resolve } from 'node:path';

const tenantRoot = process.env.NEBULA_TENANT_ROOT;
if (!tenantRoot) {
  throw new Error('NEBULA_TENANT_ROOT is not set — run through the nebula-docs CLI.');
}

// Load every routable MDX page. Snippets are resolved by remarkSnippets at
// MDX-compile time, so they should not be exposed as their own routes.
const docs = defineCollection({
  loader: glob({
    pattern: ['**/*.mdx', '!snippets/**'],
    base: resolve(tenantRoot, 'content'),
  }),
});

export const collections = { docs };
