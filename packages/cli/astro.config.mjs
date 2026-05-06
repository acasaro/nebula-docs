import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { remarkAutoComponentImports } from '@nebula-docs/mdx';

const require = createRequire(import.meta.url);

// Resolve workspace packages to their actual location so MDX files in the
// tenant repo (which doesn't have these in node_modules) can `import` them
// via auto-injected import statements.
const nebulaComponentsEntry = require.resolve('@nebula-docs/components');

const here = fileURLToPath(new URL('.', import.meta.url));
const tenantRoot = process.env.NEBULA_TENANT_ROOT;
const outDir = process.env.NEBULA_OUT_DIR;
const base = process.env.NEBULA_BASE;

/**
 * Shiki transformer: parse the fence's meta string (e.g.
 * ```ts add.ts lines wrap`) and stamp the rendered `<pre>` with data
 * attributes the rest of the renderer reads:
 *   - `data-filename`           — first non-`key=value` token (filename label)
 *   - `data-show-line-numbers`  — `lines` flag → CSS counter renders gutter
 *   - `data-wrap-code`          — `wrap`  flag → CSS soft-wraps long lines
 *
 * Mirrors the editor's `parseCodeMeta` in mdastToTiptap.ts so the same
 * fence syntax round-trips end-to-end (editor toggles → MDX flags →
 * CLI render).
 */
const shikiCodeMetaTransformer = {
  name: 'nebula-code-meta',
  pre(node) {
    const meta = this?.options?.meta?.__raw;
    if (!meta || typeof meta !== 'string') return;
    let filename;
    let lines = false;
    let wrap = false;
    for (const token of meta.split(/\s+/).filter(Boolean)) {
      if (/^[A-Za-z_][A-Za-z0-9_-]*=/.test(token)) continue;
      if (token === 'lines') { lines = true; continue; }
      if (token === 'wrap') { wrap = true; continue; }
      if (!filename) filename = token;
    }
    const props = { ...node.properties };
    if (filename) props['data-filename'] = filename;
    if (lines) props['data-show-line-numbers'] = 'true';
    if (wrap) props['data-wrap-code'] = 'true';
    node.properties = props;
  },
};

if (!tenantRoot) {
  throw new Error(
    'NEBULA_TENANT_ROOT is not set. Run via `nebula <command> <tenant-path>` instead of invoking astro directly.',
  );
}

/**
 * Mintlify-style snippets work via standard ES module imports inside MDX:
 *   `import Disclaimer from "/snippets/disclaimer.mdx";`
 *   `<Disclaimer />`
 *
 * Astro + `@astrojs/mdx` handle imports natively via Vite, so we don't need
 * a custom remark plugin to resolve the path. The Vite aliases below map
 * the `/`-rooted import paths Mintlify documents to actual files in the
 * tenant repo (Mintlify-shaped tenants use `/snippets/foo.mdx`,
 * Nebula-shaped tenants use `/content/snippets/foo.mdx`).
 *
 * `.mdx` and `.jsx` snippets are both supported — `@astrojs/mdx` returns
 * MDX components for the former; `@astrojs/react` handles the latter.
 */
const snippetAliases = [
  { find: /^\/snippets\/(.+)$/, replacement: resolve(tenantRoot, 'snippets/$1') },
  { find: /^\/content\/snippets\/(.+)$/, replacement: resolve(tenantRoot, 'content/snippets/$1') },
  // `/shared/...` mirrors Mintlify's documented alternative location.
  { find: /^\/shared\/(.+)$/, replacement: resolve(tenantRoot, 'shared/$1') },
];

/**
 * Mintlify-style auto-imports: tenants write `<Callout>` or `<Card>` in
 * any MDX file (page or snippet) without an `import` line; the plugin
 * walks the AST, collects unimported component-name JSX tags, and
 * prepends `import { ... } from "@nebula-docs/components"` with a
 * properly populated `data.estree` (so the MDX→JS compiler emits the
 * import — `value` alone gets dropped).
 *
 * IMPORTANT: components with an Astro variant in `src/runtime/components/`
 * (Tabs, Tab, Steps, Step) are deliberately omitted. Those tags MUST
 * resolve via the page's `components={...}` map (set in `[...slug].astro`)
 * which routes them to the Astro versions — the React versions break on
 * the Astro+React+MDX children-introspection boundary (children come
 * through as pre-rendered HTML strings, not React elements). An
 * auto-injected `import { Tabs } from "@nebula-docs/components"` shadows
 * the components map and forces the broken React variant. Add new
 * Astro-variant components to BOTH the page route map AND this skip list.
 */
const NEBULA_COMPONENTS = '@nebula-docs/components';
const autoImportComponents = {
  Accordion: NEBULA_COMPONENTS,
  AccordionGroup: NEBULA_COMPONENTS,
  Badge: NEBULA_COMPONENTS,
  Callout: NEBULA_COMPONENTS,
  Card: NEBULA_COMPONENTS,
  CardGroup: NEBULA_COMPONENTS,
  Check: NEBULA_COMPONENTS,
  CodeBlock: NEBULA_COMPONENTS,
  // CodeGroup intentionally skipped — Astro variant in src/runtime/components.
  Column: NEBULA_COMPONENTS,
  Columns: NEBULA_COMPONENTS,
  Danger: NEBULA_COMPONENTS,
  Expandable: NEBULA_COMPONENTS,
  Frame: NEBULA_COMPONENTS,
  Icon: NEBULA_COMPONENTS,
  Info: NEBULA_COMPONENTS,
  // Mermaid intentionally omitted — see comment above (Astro wrapper attaches `client:visible`).
  Note: NEBULA_COMPONENTS,
  ParamField: NEBULA_COMPONENTS,
  RequestExample: NEBULA_COMPONENTS,
  ResponseExample: NEBULA_COMPONENTS,
  ResponseField: NEBULA_COMPONENTS,
  // Steps/Step/Tabs/Tab/Tree intentionally skipped — see comment above.
  Tip: NEBULA_COMPONENTS,
  Update: NEBULA_COMPONENTS,
  Warning: NEBULA_COMPONENTS,
};

export default defineConfig({
  root: here,
  outDir: outDir ?? resolve(tenantRoot, 'dist'),
  base: base ?? '/',
  trailingSlash: 'never',
  markdown: {
    shikiConfig: {
      // Dual-theme: emit one set of styles per theme; CSS toggles which
      // resolves based on `.dark` / `[data-theme="dark"]` on the document
      // root. Without this, fenced code blocks ship with a single theme's
      // hardcoded background color and look out of place when the page
      // is in the opposite theme.
      themes: {
        light: 'github-light',
        dark: 'github-dark',
      },
      defaultColor: false,
      transformers: [shikiCodeMetaTransformer],
    },
  },
  integrations: [
    mdx({
      remarkPlugins: [
        [remarkAutoComponentImports, { components: autoImportComponents }],
      ],
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: [
        // tenant-relative absolute paths so MDX `<img src="/assets/...">` and
        // anything that imports from the tenant works under both dev and build.
        { find: '@tenant', replacement: tenantRoot },
        // Workspace package — MDX files in the tenant repo `import { Callout }
        // from "@nebula-docs/components"` (auto-injected by the plugin) but
        // the tenant repo doesn't have node_modules for it. Alias straight to
        // the workspace package's entry so the resolver finds it regardless
        // of where the import is declared.
        { find: '@nebula-docs/components', replacement: nebulaComponentsEntry },
        ...snippetAliases,
      ],
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
