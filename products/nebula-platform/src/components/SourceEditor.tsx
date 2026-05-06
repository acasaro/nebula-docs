import { useEffect, useRef, useState } from 'react';
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
 * Editable source view with MDX syntax highlighting.
 *
 * The textarea is the source of truth — its caret + selection drive editing.
 * A `<pre>` rendered via shiki is positioned underneath; the textarea text
 * is transparent (`color: transparent`), so the user sees the highlighted
 * pre but interacts with the textarea. Both must share identical font
 * metrics — same family, size, line-height, and tab-size.
 */
export function SourceEditor({ value, onChange, className }: SourceEditorProps) {
  const [html, setHtml] = useState<string>('');
  const isDark = useDarkMode();
  const taRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

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

  // Sync the pre's scroll position with the textarea's so highlighting
  // stays aligned with the caret when the content is longer than the view.
  const onScroll = () => {
    if (!taRef.current || !preRef.current) return;
    preRef.current.scrollTop = taRef.current.scrollTop;
    preRef.current.scrollLeft = taRef.current.scrollLeft;
  };

  const editable = !!onChange;

  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden bg-background',
        className,
      )}
    >
      {html ? (
        <pre
          ref={preRef}
          aria-hidden="true"
          className={cn(
            'mdx-source-pre absolute inset-0 m-0 overflow-auto whitespace-pre p-4 font-mono text-xs leading-relaxed',
            'pointer-events-none',
          )}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <pre
          ref={preRef}
          aria-hidden="true"
          className={cn(
            'mdx-source-pre absolute inset-0 m-0 overflow-auto whitespace-pre p-4 font-mono text-xs leading-relaxed text-foreground/90',
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
        readOnly={!editable}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        wrap="off"
        className={cn(
          'absolute inset-0 m-0 block h-full w-full resize-none overflow-auto whitespace-pre border-0 bg-transparent p-4 font-mono text-xs leading-relaxed outline-none',
          'text-transparent caret-foreground selection:bg-primary/30 selection:text-foreground',
        )}
      />
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
