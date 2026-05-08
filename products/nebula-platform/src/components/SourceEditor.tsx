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

/** Languages eagerly loaded with the highlighter on first init. The set
 *  intentionally covers everything a tenant repo commonly carries (MDX,
 *  config formats, the source for tenant-local components, CI workflows)
 *  so the editor goes from "nothing highlighted" to "fully highlighted"
 *  without on-demand `loadLanguage` round-trips.
 *
 *  IMPORTANT: every entry here MUST be a Shiki bundled language. Adding
 *  a non-bundled ID (e.g. `'svg'`) throws inside `createHighlighter` and
 *  kills the whole highlighter — every file then renders unstyled.
 *  Extensions like `.svg` map to `'xml'` in `EXT_TO_LANG` instead. */
const PRELOADED_LANGS: BundledLanguage[] = [
  'mdx',
  'markdown',
  'json',
  'jsonc',
  'json5',
  'yaml',
  'toml',
  'typescript',
  'tsx',
  'javascript',
  'jsx',
  'astro',
  'css',
  'scss',
  'html',
  'xml',
  'shellscript',
];

/** File-extension → Shiki language ID. Keys are lowercased ext (no dot).
 *  Falls back to `'plaintext'` when an extension isn't mapped, which Shiki
 *  also accepts and renders unstyled (no highlighter color tokens). */
const EXT_TO_LANG: Record<string, BundledLanguage | 'plaintext'> = {
  mdx: 'mdx',
  md: 'markdown',
  markdown: 'markdown',
  json: 'json',
  jsonc: 'jsonc',
  json5: 'json5',
  yaml: 'yaml',
  yml: 'yaml',
  toml: 'toml',
  ts: 'typescript',
  mts: 'typescript',
  cts: 'typescript',
  tsx: 'tsx',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'jsx',
  astro: 'astro',
  css: 'css',
  scss: 'scss',
  sass: 'scss',
  html: 'html',
  htm: 'html',
  xml: 'xml',
  svg: 'xml',
  sh: 'shellscript',
  bash: 'shellscript',
  zsh: 'shellscript',
  txt: 'plaintext',
};

/** Resolve a file path (or basename) to its Shiki language ID. Handles
 *  composite filenames the extension lookup would miss (e.g. `.gitignore`,
 *  `Dockerfile`) — the docs platform doesn't render those today, but the
 *  fallback to `plaintext` keeps things safe regardless. */
export function languageForPath(path: string | null | undefined): BundledLanguage | 'plaintext' {
  if (!path) return 'plaintext';
  const base = path.split('/').pop() ?? '';
  const idx = base.lastIndexOf('.');
  if (idx <= 0) return 'plaintext';
  const ext = base.slice(idx + 1).toLowerCase();
  return EXT_TO_LANG[ext] ?? 'plaintext';
}

let highlighterPromise: Promise<ShikiInstance> | null = null;

function getHighlighter(): Promise<ShikiInstance> {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      const { createHighlighter } = await import('shiki');
      const hl = await createHighlighter({
        themes: [LIGHT_THEME, DARK_THEME],
        langs: PRELOADED_LANGS,
      });
      return hl as ShikiInstance;
    })();
  }
  return highlighterPromise;
}

interface SourceEditorProps {
  value: string;
  onChange?: (next: string) => void;
  /** Shiki language ID. Defaults to `'mdx'`. Pass `'plaintext'` for files
   *  whose extension isn't in `EXT_TO_LANG`. */
  language?: BundledLanguage | 'plaintext';
  className?: string;
}

/**
 * Editable source view with Shiki syntax highlighting and a GitHub-style
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
export function SourceEditor({
  value,
  onChange,
  language = 'mdx',
  className,
}: SourceEditorProps) {
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
        // Languages outside the preloaded set fall back to plaintext rather
        // than throwing on `codeToHtml`. Keeps the editor usable for
        // unrecognized extensions.
        const loaded = new Set(hl.getLoadedLanguages());
        const lang = language !== 'plaintext' && loaded.has(language) ? language : 'plaintext';
        const rendered = hl.codeToHtml(value, { lang, theme });
        setHtml(rendered);
      })
      .catch((err) => {
        // Fall back to plain text — no highlight. Surface the error so a
        // misconfigured `PRELOADED_LANGS` (e.g. an ID not bundled in Shiki)
        // doesn't disappear into a silent code path that just renders raw
        // text everywhere.
        // eslint-disable-next-line no-console
        console.error('[SourceEditor] Shiki highlight failed:', err);
        setHtml('');
      });
    return () => {
      cancelled = true;
    };
  }, [value, isDark, language]);

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
  const gutterDigits = Math.max(2, String(lineCount).length);
  const gutterWidth = `${gutterDigits}ch`;

  return (
    <div
      className={cn(
        'relative flex h-full w-full overflow-hidden bg-background',
        className,
      )}
      data-component-part="source-editor"
    >
      {/* Gutter — wider padding (left edge breathing room + clear gap to the
          source column on the right) and a slightly larger numeric scale so
          line numbers read at a glance without overpowering the code. */}
      <div
        ref={gutterRef}
        aria-hidden="true"
        className={cn(
          'mdx-source-gutter pointer-events-none shrink-0 select-none overflow-hidden border-r border-border/40 bg-muted/20 py-5 pl-5 pr-4 font-mono text-[13px] leading-[1.65] text-muted-foreground/55',
        )}
        style={{ width: `calc(${gutterWidth} + 2.25rem)` }}
      >
        {Array.from({ length: lineCount }).map((_, i) => {
          const n = i + 1;
          return (
            <div
              key={n}
              className={cn(
                'text-right tabular-nums',
                n === activeLine && 'font-medium text-foreground',
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
              'mdx-source-pre absolute inset-0 m-0 overflow-auto whitespace-pre-wrap break-words py-5 pr-6 pl-5 font-mono text-[13px] leading-[1.65]',
              'pointer-events-none',
            )}
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : (
          <pre
            ref={preRef}
            aria-hidden="true"
            className={cn(
              'mdx-source-pre absolute inset-0 m-0 overflow-auto whitespace-pre-wrap break-words py-5 pr-6 pl-5 font-mono text-[13px] leading-[1.65] text-foreground/90',
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
          wrap="soft"
          className={cn(
            'absolute inset-0 m-0 block h-full w-full resize-none overflow-auto whitespace-pre border-0 bg-transparent py-5 pr-6 pl-5 font-mono text-[13px] leading-[1.65] outline-none',
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
