import { useEffect, useMemo, useRef, useState } from 'react';
import type {
  BundledLanguage,
  BundledTheme,
  HighlighterCore,
} from 'shiki';
import { cn } from '@/lib/utils';

type ShikiInstance = HighlighterCore & {
  getLoadedLanguages: () => string[];
};

const LIGHT_THEME: BundledTheme = 'github-light';
const DARK_THEME: BundledTheme = 'github-dark';
const LANGS: BundledLanguage[] = ['mdx'];

let highlighterPromise: Promise<ShikiInstance> | null = null;

function getHighlighter(): Promise<ShikiInstance> {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const { createHighlighter } = await import('shiki');
      const hl = await createHighlighter({
        themes: [LIGHT_THEME, DARK_THEME],
        langs: LANGS,
      });
      return hl as ShikiInstance;
    })();
  }
  return highlighterPromise;
}

interface SourceEditorProps {
  value: string;
  onChange?: (next: string) => void;
  className?: string;
}

/**
 * Editable source view with MDX syntax highlighting and a GitHub-style
 * line-number gutter.
 *
 * The textarea is the source of truth — its caret + selection drive editing.
 * A `<pre>` rendered via shiki is positioned underneath; the textarea text
 * is transparent (`color: transparent`), so the user sees the highlighted
 * pre but interacts with the textarea. The gutter is a third overlay on the
 * left, scroll-synced with the textarea so each number tracks its row.
 *
 * All three layers must share identical font metrics — same family, size,
 * line-height, and tab-size — or the gutter drifts as the file scrolls.
 */
export function SourceEditor({ value, onChange, className }: SourceEditorProps) {
  const [html, setHtml] = useState<string>('');
  const [activeLine, setActiveLine] = useState(1);
  const isDark = useDarkMode();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  const lineCount = useMemo(() => {
    if (!value) return 1;
    // Mirror what GitHub shows: a trailing `\n` produces an empty line N+1.
    const newlines = (value.match(/\n/g) ?? []).length;
    return Math.max(1, newlines + (value.endsWith('\n') ? 1 : 1));
  }, [value]);

  useEffect(() => {
    let cancelled = false;
    getHighlighter()
      .then((hl) => {
        if (cancelled) return;
        const theme = isDark ? DARK_THEME : LIGHT_THEME;
        const rendered = hl.codeToHtml(value, { lang: 'mdx', theme });
        setHtml(rendered);
      })
      .catch(() => {
        // Fall back to plain text — no highlight.
        setHtml('');
      });
    return () => {
      cancelled = true;
    };
  }, [value, isDark]);

  // Sync the pre + gutter scroll positions with the textarea's so the
  // highlighting and line numbers stay aligned with the caret.
  const onScroll = () => {
    const ta = taRef.current;
    if (!ta) return;
    if (preRef.current) {
      preRef.current.scrollTop = ta.scrollTop;
      preRef.current.scrollLeft = ta.scrollLeft;
    }
    if (gutterRef.current) {
      gutterRef.current.scrollTop = ta.scrollTop;
    }
  };

  const onSelectionChange = () => {
    const ta = taRef.current;
    if (!ta) return;
    const before = value.slice(0, ta.selectionStart);
    const line = (before.match(/\n/g) ?? []).length + 1;
    setActiveLine(line);
  };

  const editable = !!onChange;
  const gutterWidth = `${Math.max(2, String(lineCount).length)}ch`;

  return (
    <div
      className={cn(
        'relative flex h-full w-full overflow-hidden bg-background',
        className,
      )}
      data-component-part="source-editor"
    >
      <div
        ref={gutterRef}
        aria-hidden="true"
        className={cn(
          'mdx-source-gutter pointer-events-none shrink-0 select-none overflow-hidden border-r border-border/40 py-4 pl-3 pr-2 font-mono text-xs leading-relaxed text-muted-foreground/60',
        )}
        style={{ width: `calc(${gutterWidth} + 1.25rem)` }}
      >
        {Array.from({ length: lineCount }).map((_, i) => {
          const n = i + 1;
          return (
            <div
              key={n}
              className={cn(
                'text-right tabular-nums',
                n === activeLine && 'text-foreground',
              )}
              style={{ width: gutterWidth }}
            >
              {n}
            </div>
          );
        })}
      </div>
      <div className="relative flex-1 overflow-hidden">
        {html ? (
          <pre
            ref={preRef}
            aria-hidden="true"
            className={cn(
              'mdx-source-pre absolute inset-0 m-0 overflow-auto whitespace-pre py-4 pr-4 pl-2 font-mono text-xs leading-relaxed',
              'pointer-events-none',
            )}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre
            ref={preRef}
            aria-hidden="true"
            className={cn(
              'mdx-source-pre absolute inset-0 m-0 overflow-auto whitespace-pre py-4 pr-4 pl-2 font-mono text-xs leading-relaxed text-foreground/90',
              'pointer-events-none',
            )}
          >
            {value}
          </pre>
        )}
        <textarea
          ref={taRef}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          onScroll={onScroll}
          onSelect={onSelectionChange}
          onKeyUp={onSelectionChange}
          onClick={onSelectionChange}
          readOnly={!editable}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          wrap="off"
          className={cn(
            'absolute inset-0 m-0 block h-full w-full resize-none overflow-auto whitespace-pre border-0 bg-transparent py-4 pr-4 pl-2 font-mono text-xs leading-relaxed outline-none',
            'text-transparent caret-foreground selection:bg-primary/30 selection:text-foreground',
          )}
        />
      </div>
    </div>
  );
}

function useDarkMode(): boolean {
  const [dark, setDark] = useState(() =>
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark'),
  );
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    const update = () => setDark(root.classList.contains('dark'));
    const observer = new MutationObserver(update);
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return dark;
}
