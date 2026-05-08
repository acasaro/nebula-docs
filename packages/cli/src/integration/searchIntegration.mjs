import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/**
 * Astro integration that runs Pagefind against the built `dist/` after
 * `astro build` finishes. Only runs when the tenant's `docs.json` has a
 * `search` block — tenants who omit it ship zero search JS AND zero
 * Pagefind index. The Navbar's search trigger is gated on the same flag,
 * so removing the key removes the entire feature surface end-to-end.
 *
 * Pagefind's Node API spawns a Rust binary, walks the HTML output, and
 * writes `<dist>/pagefind/{pagefind.js, pagefind-ui.css, fragment/, index/}`.
 * The runtime React island dynamic-imports `/pagefind/pagefind.js` at
 * search-modal-open time (not at island hydration), so the wasm + index
 * chunks only load when the user actually opens search.
 *
 * Dev-mode caveat: Astro dev serves source modules, not built HTML, so
 * there's no index to query. The modal handles the missing-index 404
 * gracefully (renders a "search is only available after nebula build"
 * placeholder). A live dev index would require running Pagefind on each
 * HMR rebuild — deferred until a tenant complains.
 */
export default function searchIntegration() {
  return {
    name: 'nebula-search',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        const tenantRoot = process.env.NEBULA_TENANT_ROOT;
        if (!tenantRoot) return;

        const docsJsonPath = resolve(tenantRoot, 'docs.json');
        if (!existsSync(docsJsonPath)) return;

        let docs;
        try {
          docs = JSON.parse(readFileSync(docsJsonPath, 'utf8'));
        } catch (err) {
          logger.warn(`could not parse docs.json: ${err?.message ?? err}`);
          return;
        }

        if (!docs.search) {
          logger.info('docs.json has no search block — skipping Pagefind index');
          return;
        }

        const provider = docs.search.provider ?? 'pagefind';
        if (provider !== 'pagefind') {
          logger.warn(
            `docs.json search.provider="${provider}" is not yet implemented; only "pagefind" is supported. Skipping.`,
          );
          return;
        }

        const distPath = fileURLToPath(dir);

        let pagefind;
        try {
          pagefind = await import('pagefind');
        } catch (err) {
          logger.error(
            `could not load Pagefind: ${err?.message ?? err}. Run "pnpm install" in the CLI package.`,
          );
          return;
        }

        const startedAt = Date.now();
        const { index, errors: createErrors } = await pagefind.createIndex({
          // Pagefind looks for `data-pagefind-body` and falls back to the
          // root selector. Our DocsLayout marks the article body so the
          // sidebar / navbar / footer aren't indexed (they'd otherwise
          // dominate every page's snippet).
          rootSelector: 'html',
        });
        if (createErrors?.length) {
          logger.error(`pagefind createIndex: ${createErrors.join('; ')}`);
          return;
        }

        const { errors: addErrors, page_count } = await index.addDirectory({
          path: distPath,
        });
        if (addErrors?.length) {
          logger.error(`pagefind addDirectory: ${addErrors.join('; ')}`);
          return;
        }

        const { errors: writeErrors } = await index.writeFiles({
          outputPath: resolve(distPath, 'pagefind'),
        });
        if (writeErrors?.length) {
          logger.error(`pagefind writeFiles: ${writeErrors.join('; ')}`);
          return;
        }

        await pagefind.close();
        logger.info(
          `pagefind: indexed ${page_count} page${page_count === 1 ? '' : 's'} in ${Date.now() - startedAt}ms`,
        );
      },
    },
  };
}
