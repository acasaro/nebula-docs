import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { remarkSnippets } from '@nebula-docs/mdx';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';

const here = fileURLToPath(new URL('.', import.meta.url));
const tenantRoot = process.env.NEBULA_TENANT_ROOT;
const outDir = process.env.NEBULA_OUT_DIR;
const base = process.env.NEBULA_BASE;

if (!tenantRoot) {
  throw new Error(
    'NEBULA_TENANT_ROOT is not set. Run via `nebula <command> <tenant-path>` instead of invoking astro directly.',
  );
}

const snippetsDir = resolve(tenantRoot, 'content', 'snippets');

/**
 * Snippet resolver — `<Snippet file="..." />` looks up
 * <tenant>/content/snippets/<file>.mdx. The plugin from @nebula-docs/mdx
 * wires both build-time (here) and editor-time (Platform) callers.
 */
function resolveSnippetFile(spec) {
  const candidate = spec.endsWith('.mdx')
    ? resolve(snippetsDir, spec)
    : resolve(snippetsDir, `${spec}.mdx`);
  if (!existsSync(candidate)) return undefined;
  return readFileSync(candidate, 'utf8');
}

export default defineConfig({
  root: here,
  outDir: outDir ?? resolve(tenantRoot, 'dist'),
  base: base ?? '/',
  trailingSlash: 'never',
  integrations: [
    mdx({
      remarkPlugins: [[remarkSnippets, { resolveFile: resolveSnippetFile }]],
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        // tenant-relative absolute paths so MDX `<img src="/assets/...">` and
        // anything that imports from the tenant works under both dev and build.
        '@tenant': tenantRoot,
      },
    },
    server: {
      fs: {
        // Allow Vite to serve the tenant directory (it lives outside the
        // CLI package's root). pnpm-symlinked workspace files also need this.
        allow: [tenantRoot, resolve(here, '..', '..')],
      },
    },
  },
});
