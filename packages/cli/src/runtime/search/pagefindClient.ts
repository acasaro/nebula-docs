/**
 * Thin typed wrapper over Pagefind's runtime entry. The runtime ships
 * to `<base>/pagefind/pagefind.js` at build time (the searchIntegration
 * Astro hook puts it there). At edit-time Vite has nothing to resolve,
 * so the import is gated behind `@vite-ignore` and we string-template
 * the URL — Vite leaves the dynamic import alone, the browser fetches
 * it at runtime.
 *
 * Tenants who don't enable search never reach this code: the navbar
 * trigger isn't rendered, the SearchModal island isn't placed in the
 * layout, and the chunk holding this module never enters the page's
 * dependency graph.
 */

export interface PagefindResultMeta {
  title?: string;
  tab?: string;
  /** Pagefind's auto-extracted excerpt (already highlighted) */
  excerpt?: string;
  /** Anything else the page authored via data-pagefind-meta */
  [key: string]: string | undefined;
}

export interface PagefindResultData {
  url: string;
  excerpt: string;
  meta: PagefindResultMeta;
  raw_url?: string;
  raw_content?: string;
  word_count?: number;
}

export interface PagefindResult {
  id: string;
  data: () => Promise<PagefindResultData>;
}

export interface PagefindSearchResponse {
  results: PagefindResult[];
  unfilteredResultCount?: number;
}

export interface Pagefind {
  search: (query: string, options?: Record<string, unknown>) => Promise<PagefindSearchResponse>;
  debouncedSearch: (
    query: string,
    options?: Record<string, unknown>,
    debounceTimeoutMs?: number,
  ) => Promise<PagefindSearchResponse | null>;
  preload: (query: string) => Promise<void>;
  options: (opts: Record<string, unknown>) => Promise<void>;
  destroy?: () => Promise<void>;
}

let pagefindPromise: Promise<Pagefind | null> | null = null;

/**
 * Resolve the Pagefind runtime once per page. Returns null when the
 * site wasn't built with search (the dist is missing /pagefind/) — the
 * modal renders an "available after build" placeholder in that case.
 */
export function loadPagefind(base: string): Promise<Pagefind | null> {
  if (pagefindPromise) return pagefindPromise;
  const normalizedBase = base.endsWith('/') ? base : `${base}/`;
  const url = `${normalizedBase}pagefind/pagefind.js`;
  pagefindPromise = (async () => {
    try {
      const mod = (await import(/* @vite-ignore */ url)) as Pagefind;
      if (typeof mod.options === 'function') {
        await mod.options({ baseUrl: normalizedBase });
      }
      return mod;
    } catch (err) {
      console.warn('[nebula-search] pagefind runtime not available:', err);
      return null;
    }
  })();
  return pagefindPromise;
}
