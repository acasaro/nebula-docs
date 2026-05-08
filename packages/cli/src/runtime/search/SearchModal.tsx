import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  loadPagefind,
  type Pagefind,
  type PagefindResultData,
} from './pagefindClient';

export interface SearchModalProps {
  /** Site base path passed from Astro (`Astro.config.base`). Used when
   * locating `/pagefind/pagefind.js` so the runtime resolves correctly
   * under preview deploys served from `/previews/<PR>/`. */
  base?: string;
  /** "tab" | "page" | "none" — controls how results group in the list. */
  scopeBy?: 'tab' | 'page' | 'none';
}

interface ResolvedResult extends PagefindResultData {
  id: string;
}

const SEARCH_DEBOUNCE_MS = 80;
const MAX_VISIBLE_RESULTS = 30;

export default function SearchModal({ base = '/', scopeBy = 'tab' }: SearchModalProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ResolvedResult[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pagefindRef = useRef<Pagefind | null>(null);

  // ── Open / close wiring ────────────────────────────────────────────
  // The navbar's search button dispatches `nebula:search:open`; / and
  // Cmd-K / Ctrl-K open from anywhere on the page. Esc closes. We keep
  // the listener registered for the lifetime of the island so the modal
  // is reachable even from deep inside another component's keymap.
  useEffect(() => {
    const onOpen = () => setOpen(true);
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
        return;
      }
      // `/` opens search, but only when the user isn't already typing
      // somewhere — otherwise pressing `/` in any input on the page
      // would yank focus away. Same heuristic Algolia DocSearch uses.
      if (e.key === '/') {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName;
        const editable = target?.isContentEditable;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || editable) return;
        e.preventDefault();
        setOpen(true);
        return;
      }
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('nebula:search:open', onOpen);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('nebula:search:open', onOpen);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  // Lock body scroll while open so wheel/touch events on the backdrop
  // don't scroll the page underneath.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Focus the input on open, reset query on close. Reset is intentional —
  // re-opening with a stale query feels wrong; users almost always want a
  // fresh search.
  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
    } else {
      setQuery('');
      setResults([]);
      setActiveIndex(0);
    }
  }, [open]);

  // Lazy-load Pagefind on first open. The runtime is ~50KB JS + a wasm
  // chunk + per-page index fragments — keeping it out of the initial
  // bundle is the whole reason this is a separate island.
  useEffect(() => {
    if (!open || pagefindRef.current || status === 'unavailable') return;
    setStatus('loading');
    loadPagefind(base).then((pf) => {
      pagefindRef.current = pf;
      setStatus(pf ? 'ready' : 'unavailable');
    });
  }, [open, base, status]);

  // ── Run search on query change ────────────────────────────────────
  useEffect(() => {
    if (!open || status !== 'ready') return;
    const pf = pagefindRef.current;
    if (!pf) return;
    if (!query.trim()) {
      setResults([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      const response = await pf.debouncedSearch(query, {}, SEARCH_DEBOUNCE_MS);
      if (cancelled || !response) return;
      const visible = response.results.slice(0, MAX_VISIBLE_RESULTS);
      const resolved = await Promise.all(
        visible.map(async (r) => ({ id: r.id, ...(await r.data()) })),
      );
      if (cancelled) return;
      setResults(resolved);
      setActiveIndex(0);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [query, open, status]);

  // Group by scope. For scopeBy="none" or "page" we collapse to a single
  // synthetic group; the renderer omits the header for that case.
  const grouped = useMemo(() => {
    if (scopeBy !== 'tab') {
      return [{ label: '', items: results }];
    }
    const buckets = new Map<string, ResolvedResult[]>();
    for (const r of results) {
      const tab = r.meta?.tab ?? '';
      const list = buckets.get(tab) ?? [];
      list.push(r);
      buckets.set(tab, list);
    }
    return Array.from(buckets.entries()).map(([label, items]) => ({ label, items }));
  }, [results, scopeBy]);

  const flatVisible = useMemo(
    () => grouped.flatMap((g) => g.items),
    [grouped],
  );

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, flatVisible.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        const target = flatVisible[activeIndex];
        if (target) {
          window.location.href = target.url;
        }
      }
    },
    [flatVisible, activeIndex],
  );

  if (!open) return null;

  return (
    <div
      className="nebula-search-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search documentation"
    >
      <div className="nebula-search-modal">
        <div className="nebula-search-input-row">
          <svg
            className="nebula-search-input-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.3-4.3"></path>
          </svg>
          <input
            ref={inputRef}
            className="nebula-search-input"
            type="search"
            placeholder="Search documentation"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            aria-label="Search query"
            spellCheck={false}
            autoComplete="off"
          />
          <button
            type="button"
            className="nebula-search-close"
            onClick={() => setOpen(false)}
            aria-label="Close search"
          >
            <kbd className="nebula-kbd">Esc</kbd>
          </button>
        </div>
        <div className="nebula-search-results">
          {status === 'loading' && (
            <p className="nebula-search-empty">Loading search index…</p>
          )}
          {status === 'unavailable' && (
            <p className="nebula-search-empty">
              Search is only available after running <code>nebula build</code>.
              The dev server doesn't generate a Pagefind index.
            </p>
          )}
          {status === 'ready' && !query.trim() && (
            <p className="nebula-search-empty">Type to search the docs.</p>
          )}
          {status === 'ready' && query.trim() && results.length === 0 && (
            <p className="nebula-search-empty">No results for "{query}".</p>
          )}
          {results.length > 0 && (
            <ul className="nebula-search-result-list" role="listbox">
              {grouped.map((group, gi) => (
                <li key={group.label || gi} className="nebula-search-group">
                  {group.label && (
                    <p className="nebula-search-group-label">{group.label}</p>
                  )}
                  <ul>
                    {group.items.map((r) => {
                      const flatIndex = flatVisible.indexOf(r);
                      const isActive = flatIndex === activeIndex;
                      return (
                        <li key={r.id}>
                          <a
                            href={r.url}
                            className={
                              isActive
                                ? 'nebula-search-result nebula-search-result--active'
                                : 'nebula-search-result'
                            }
                            onMouseEnter={() => setActiveIndex(flatIndex)}
                          >
                            <span className="nebula-search-result-title">
                              {r.meta?.title ?? r.url}
                            </span>
                            <span
                              className="nebula-search-result-excerpt"
                              dangerouslySetInnerHTML={{ __html: r.excerpt }}
                            />
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="nebula-search-footer">
          <span>
            <kbd className="nebula-kbd">↑</kbd>
            <kbd className="nebula-kbd">↓</kbd> to navigate
          </span>
          <span>
            <kbd className="nebula-kbd">↵</kbd> to open
          </span>
          <span>
            <kbd className="nebula-kbd">Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
