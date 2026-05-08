import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import { remarkAutoComponentImports } from "@nebula-docs/mdx";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { composeTokensCss } from "./src/runtime/lib/composeTokens.mjs";

const require = createRequire(import.meta.url);

// Resolve workspace packages to their actual location so MDX files in the
// tenant repo (which doesn't have these in node_modules) can `import` them
// via auto-injected import statements.
const nebulaComponentsEntry = require.resolve("@nebula-docs/components");

const here = fileURLToPath(new URL(".", import.meta.url));
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
  name: "nebula-code-meta",
  pre(node) {
    const meta = this?.options?.meta?.__raw;
    if (!meta || typeof meta !== "string") return;
    let filename;
    let lines = false;
    let wrap = false;
    for (const token of meta.split(/\s+/).filter(Boolean)) {
      if (/^[A-Za-z_][A-Za-z0-9_-]*=/.test(token)) continue;
      if (token === "lines") {
        lines = true;
        continue;
      }
      if (token === "wrap") {
        wrap = true;
        continue;
      }
      if (!filename) filename = token;
    }
    const props = { ...node.properties };
    if (filename) props["data-filename"] = filename;
    if (lines) props["data-show-line-numbers"] = "true";
    if (wrap) props["data-wrap-code"] = "true";
    node.properties = props;
  },
};

if (!tenantRoot) {
  throw new Error(
    "NEBULA_TENANT_ROOT is not set. Run via `nebula <command> <tenant-path>` instead of invoking astro directly.",
  );
}

/**
 * Theme HMR — keep `.nebula/tokens.css` in sync with the tenant's
 * `theme.json` and `docs.json` (the latter holds `theme.base`) while the dev
 * server is running. Without this, `prepareAstroEnv` writes tokens.css once
 * at startup; later edits via the editor or a manual save sit unseen until
 * the dev server is restarted.
 *
 * On file change we recompose the CSS, write it back to the same path, and
 * trigger a CSS module reload via the Vite WS so the page refreshes its
 * variables without a full reload.
 */
const tenantThemePath = resolve(tenantRoot, "theme.json");
const tenantDocsPath = resolve(tenantRoot, "docs.json");
const tokensOutPath = resolve(here, ".nebula", "tokens.css");
const tokensImporterPath = resolve(here, "src", "styles", "global.css");

function nebulaThemeHmrPlugin() {
  return {
    name: "nebula-theme-hmr",
    apply: "serve",
    configureServer(server) {
      const recompose = async () => {
        try {
          const docs = JSON.parse(readFileSync(tenantDocsPath, "utf8"));
          const overrides = existsSync(tenantThemePath)
            ? JSON.parse(readFileSync(tenantThemePath, "utf8"))
            : null;
          const baseId =
            docs.theme?.base ?? overrides?.extends ?? "mcoe-default";
          const css = await composeTokensCss({ baseId, overrides });
          writeFileSync(tokensOutPath, css);
          // Touching the importer triggers Vite's standard CSS HMR pipeline
          // (it doesn't watch generated files, but it does invalidate any
          // module that imports a changed leaf via the resolver). Sending an
          // explicit `update` message keeps the browser from full-reloading
          // when only the variables changed.
          const mod = server.moduleGraph.getModuleById(tokensImporterPath);
          if (mod) {
            server.moduleGraph.invalidateModule(mod);
          }
          server.ws.send({
            type: "update",
            updates: [
              {
                type: "css-update",
                path: "/src/styles/global.css",
                acceptedPath: "/src/styles/global.css",
                timestamp: Date.now(),
              },
            ],
          });
        } catch (err) {
          server.config.logger.error(
            `[nebula-theme-hmr] ${err && err.message ? err.message : String(err)}`,
          );
        }
      };

      server.watcher.add(tenantThemePath);
      server.watcher.add(tenantDocsPath);
      const onChange = (path) => {
        if (path === tenantThemePath || path === tenantDocsPath) {
          recompose();
        }
      };
      server.watcher.on("change", onChange);
      server.watcher.on("add", onChange);
    },
  };
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
  { find: /^\/snippets\/(.+)$/, replacement: resolve(tenantRoot, "snippets/$1") },
  { find: /^\/content\/snippets\/(.+)$/, replacement: resolve(tenantRoot, "content/snippets/$1") },
  // `/shared/...` mirrors Mintlify's documented alternative location.
  { find: /^\/shared\/(.+)$/, replacement: resolve(tenantRoot, "shared/$1") },
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
const NEBULA_COMPONENTS = "@nebula-docs/components";
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
  // Hero intentionally skipped — Astro variant in src/runtime/components
  // attaches `client:visible` so pagination clicks hydrate.
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
  Tooltip: NEBULA_COMPONENTS,
  Update: NEBULA_COMPONENTS,
  Warning: NEBULA_COMPONENTS,
};

export default defineConfig({
  root: here,
  outDir: outDir ?? resolve(tenantRoot, "dist"),
  publicDir: resolve(tenantRoot, "public"),
  base: base ?? "/",
  trailingSlash: "never",
  markdown: {
    shikiConfig: {
      // Dual-theme: emit one set of styles per theme; CSS toggles which
      // resolves based on `.dark` / `[data-theme="dark"]` on the document
      // root. Without this, fenced code blocks ship with a single theme's
      // hardcoded background color and look out of place when the page
      // is in the opposite theme.
      //
      // The tenant's theme.json `codeBlock.light` / `codeBlock.dark` pick
      // is surfaced via env vars set in prepareAstro.mjs. Falls back to
      // github-{light,dark} when unset so existing tenants render the
      // same as before.
      themes: {
        light: process.env.NEBULA_SHIKI_LIGHT || "github-light",
        dark: process.env.NEBULA_SHIKI_DARK || "github-dark",
      },
      defaultColor: false,
      transformers: [shikiCodeMetaTransformer],
    },
  },
  integrations: [
    mdx({
      remarkPlugins: [[remarkAutoComponentImports, { components: autoImportComponents }]],
    }),
    react(),
  ],
  vite: {
    plugins: [tailwindcss(), nebulaThemeHmrPlugin()],
    resolve: {
      alias: [
        // tenant-relative absolute paths so MDX `<img src="/assets/...">` and
        // anything that imports from the tenant works under both dev and build.
        { find: "@tenant", replacement: tenantRoot },
        // Workspace package — MDX files in the tenant repo `import { Callout }
        // from "@nebula-docs/components"` (auto-injected by the plugin) but
        // the tenant repo doesn't have node_modules for it. Alias straight to
        // the workspace package's entry so the resolver finds it regardless
        // of where the import is declared.
        { find: "@nebula-docs/components", replacement: nebulaComponentsEntry },
        ...snippetAliases,
      ],
    },
    server: {
      fs: {
        // Allow Vite to serve the tenant directory (it lives outside the
        // CLI package's root). pnpm-symlinked workspace files also need this.
        allow: [tenantRoot, resolve(here, "..", "..")],
      },
    },
  },
});
