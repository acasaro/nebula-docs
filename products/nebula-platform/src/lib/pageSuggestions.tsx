import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  defaultPageTitle,
  isPageObject,
  reachablePages,
  type DocsConfig,
  type PageEntry,
} from './docsConfig';

export interface PageSuggestion {
  /** Absolute URL form the editor inserts (always leading slash). */
  url: string;
  /** Slug shown to the user under the title. */
  slug: string;
  /** Human-readable label (sidebarTitle, else prettified last segment). */
  title: string;
}

function entryToSuggestion(entry: PageEntry): PageSuggestion | null {
  if (typeof entry === 'string') {
    return { url: `/${entry}`, slug: entry, title: defaultPageTitle(entry) };
  }
  if (!isPageObject(entry)) return null;
  if (entry.externalUrl) return null;
  const pagePath = entry.page ?? entry.slug;
  if (!pagePath) return null;
  const slug = entry.slug ?? pagePath;
  const title = entry.sidebarTitle ?? defaultPageTitle(pagePath);
  return { url: `/${slug}`, slug, title };
}

export function extractPageSuggestions(
  config: DocsConfig | null,
): PageSuggestion[] {
  if (!config) return [];
  const out: PageSuggestion[] = [];
  const seen = new Set<string>();
  for (const entry of reachablePages(config)) {
    const s = entryToSuggestion(entry);
    if (!s) continue;
    if (seen.has(s.url)) continue;
    seen.add(s.url);
    out.push(s);
  }
  return out;
}

const PageSuggestionsContext = createContext<readonly PageSuggestion[]>([]);

interface PageSuggestionsProviderProps {
  pages: readonly PageSuggestion[];
  children: ReactNode;
}

export function PageSuggestionsProvider({
  pages,
  children,
}: PageSuggestionsProviderProps) {
  const value = useMemo(() => pages, [pages]);
  return (
    <PageSuggestionsContext.Provider value={value}>
      {children}
    </PageSuggestionsContext.Provider>
  );
}

export function usePageSuggestions(): readonly PageSuggestion[] {
  return useContext(PageSuggestionsContext);
}

/**
 * Substring filter on title + slug, case-insensitive. Empty query returns
 * the first `limit` pages so the user sees suggestions immediately on focus.
 */
export function filterPageSuggestions(
  pages: readonly PageSuggestion[],
  query: string,
  limit = 8,
): PageSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return pages.slice(0, limit);
  const out: PageSuggestion[] = [];
  for (const p of pages) {
    if (
      p.title.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q)
    ) {
      out.push(p);
      if (out.length >= limit) break;
    }
  }
  return out;
}
