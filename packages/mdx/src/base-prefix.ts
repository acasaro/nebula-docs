import type { Root } from 'mdast';
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx';
import { visit } from 'unist-util-visit';

/**
 * Remark plugin that prepends a deployment-time base path to every
 * site-rooted URL in the document. Used by the CLI when building per-PR
 * previews to `bucket/previews/<PR#>/`: Astro auto-prefixes asset URLs and
 * `import.meta.env.BASE_URL`, but does NOT rewrite `<a href="/foo">`,
 * `<img src="/foo">`, or markdown `[text](/foo)` / `![alt](/foo)`. Without
 * this plugin every internal link in a previewed page would point back to
 * the bucket root and either 404 or render the live (main-built) version
 * of the page instead of the preview.
 *
 * Rewritten:
 *   - `link` MDAST nodes (`[text](/foo)`)
 *   - `image` MDAST nodes (`![alt](/foo)`)
 *   - `href` / `src` string attributes on `mdxJsxFlowElement` /
 *     `mdxJsxTextElement` (Card, Tile, raw `<a>`, etc.)
 *
 * Pass-throughs (left unchanged):
 *   - external URLs (`http:`, `https:`, `mailto:`, `tel:`, `data:`, etc.)
 *   - protocol-relative URLs (`//foo`)
 *   - hash-only links (`#section`)
 *   - relative paths (no leading `/`)
 *   - URLs already starting with the configured base (idempotent — safe to
 *     run a second time without doubling)
 *
 * Expression-valued attributes (e.g. `<Card href={someVar} />`) are NOT
 * rewritten — there's no way to know at compile time what the expression
 * resolves to. Authors using such patterns must wrap the value with the
 * `withBase` helper themselves.
 */
export interface RemarkBasePrefixOptions {
  /** Site base, e.g. `/previews/42`. Trailing slashes are stripped. An
   *  empty / `/` base disables the plugin (returns a no-op transformer). */
  base: string;
}

export function remarkBasePrefix(options: RemarkBasePrefixOptions) {
  const raw = options?.base ?? '';
  const base = raw.replace(/\/+$/, '');

  // No base, no work. Return a no-op transformer rather than nothing so the
  // plugin can be unconditionally registered in astro.config.
  if (!base || base === '/') {
    return function noop(): void {};
  }

  function prefix(url: unknown): string | undefined {
    if (typeof url !== 'string' || url.length === 0) return url as undefined;
    if (url.startsWith('//')) return url;
    if (/^[a-z][a-z0-9+.-]*:/i.test(url)) return url;
    if (url.startsWith('#')) return url;
    if (!url.startsWith('/')) return url;
    if (url === base || url.startsWith(`${base}/`)) return url;
    return base + url;
  }

  return function transformer(tree: Root): void {
    visit(tree, (node) => {
      if (node.type === 'link' || node.type === 'image') {
        const next = prefix((node as { url?: unknown }).url);
        if (typeof next === 'string') {
          (node as { url: string }).url = next;
        }
        return;
      }
      if (node.type === 'mdxJsxFlowElement' || node.type === 'mdxJsxTextElement') {
        const attrs = (node as MdxJsxFlowElement | MdxJsxTextElement).attributes ?? [];
        for (const attr of attrs) {
          if (attr.type !== 'mdxJsxAttribute') continue;
          if (attr.name !== 'href' && attr.name !== 'src') continue;
          if (typeof attr.value !== 'string') continue;
          const next = prefix(attr.value);
          if (typeof next === 'string') {
            attr.value = next;
          }
        }
      }
    });
  };
}
