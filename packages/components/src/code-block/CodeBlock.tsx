import { useEffect, useRef, useState } from 'react';
import type {
  BundledLanguage,
  BundledTheme,
  HighlighterCore,
} from 'shiki';
import { cn } from '../utils/cn';

const SUPPORTED_LANGUAGES: BundledLanguage[] = [
  'bash',
  'css',
  'diff',
  'go',
  'graphql',
  'html',
  'http',
  'java',
  'javascript',
  'json',
  'jsx',
  'kotlin',
  'markdown',
  'mdx',
  'php',
  'python',
  'ruby',
  'rust',
  'scss',
  'shell',
  'sql',
  'swift',
  'tsx',
  'typescript',
  'vue',
  'xml',
  'yaml',
];

const DEFAULT_LIGHT_THEME: BundledTheme = 'github-light';
const DEFAULT_DARK_THEME: BundledTheme = 'github-dark';

type ShikiInstance = HighlighterCore & {
  getLoadedLanguages: () => string[];
};

// One highlighter per (light, dark) pair. Switching themes via theme.json
// is rare (settings change, not per-render), so a Map keyed by the theme
// combo avoids reloading shiki when the same pair is reused across many
// CodeBlock instances on a page.
const highlighterCache = new Map<string, Promise<ShikiInstance>>();

function getHighlighter(
  light: BundledTheme,
  dark: BundledTheme,
): Promise<ShikiInstance> {
  const key = `${light}::${dark}`;
  let p = highlighterCache.get(key);
  if (!p) {
    p = (async () => {
      const { createHighlighter } = await import('shiki');
      const hl = await createHighlighter({
        themes: [light, dark],
        langs: SUPPORTED_LANGUAGES,
      });
      return hl as ShikiInstance;
    })();
    highlighterCache.set(key, p);
  }
  return p;
}

export interface CodeBlockProps {
  code: string;
  language?: string;
  /** Optional filename label used when rendered inside a `<CodeGroup>`. */
  filename?: string;
  className?: string;
  /**
   * If true, disables the lazy theme-switching behavior and always renders
   * with the dark theme. Useful for editor surfaces where we already
   * provide the theme context.
   */
  fixedTheme?: 'light' | 'dark';
  /**
   * Override the default Shiki theme used in light mode. Driven by
   * `theme.json.codeBlock.light` at the consumer level so tenants can swap
   * the highlighter theme without forking this component. Defaults to
   * github-light.
   */
  lightTheme?: BundledTheme;
  /**
   * Override the default Shiki theme used in dark mode. Driven by
   * `theme.json.codeBlock.dark`. Defaults to github-dark.
   */
  darkTheme?: BundledTheme;
}

function resolveLanguage(input?: string): string {
  if (!input) return 'text';
  const lc = input.toLowerCase();
  if ((SUPPORTED_LANGUAGES as readonly string[]).includes(lc)) return lc;
  // Common aliases
  if (lc === 'js') return 'javascript';
  if (lc === 'ts') return 'typescript';
  if (lc === 'sh') return 'shell';
  if (lc === 'yml') return 'yaml';
  if (lc === 'md') return 'markdown';
  return 'text';
}

export function CodeBlock({
  code,
  language,
  className,
  fixedTheme,
  lightTheme,
  darkTheme,
}: CodeBlockProps) {
  const [html, setHtml] = useState<{ light: string; dark: string } | null>(null);
  const lastRequestRef = useRef(0);
  const resolvedLight = lightTheme ?? DEFAULT_LIGHT_THEME;
  const resolvedDark = darkTheme ?? DEFAULT_DARK_THEME;

  useEffect(() => {
    const requestId = ++lastRequestRef.current;
    let cancelled = false;
    const lang = resolveLanguage(language);
    getHighlighter(resolvedLight, resolvedDark)
      .then((hl) => {
        if (cancelled || lastRequestRef.current !== requestId) return;
        const safeLang = hl.getLoadedLanguages().includes(lang) ? lang : 'text';
        const light = hl.codeToHtml(code, { lang: safeLang, theme: resolvedLight });
        const dark = hl.codeToHtml(code, { lang: safeLang, theme: resolvedDark });
        setHtml({ light, dark });
      })
      .catch(() => {
        // swallow — fall back to plain code rendering
      });
    return () => {
      cancelled = true;
    };
  }, [code, language, resolvedLight, resolvedDark]);

  if (!html) {
    return (
      <pre
        className={cn(
          'my-4 overflow-x-auto rounded-md border bg-muted/60 p-4 font-mono text-xs leading-relaxed',
          className,
        )}
      >
        <code>{code}</code>
      </pre>
    );
  }

  if (fixedTheme === 'light') {
    return (
      <div
        className={cn('mdx-code-block my-4', className)}
        dangerouslySetInnerHTML={{ __html: html.light }}
      />
    );
  }
  if (fixedTheme === 'dark') {
    return (
      <div
        className={cn('mdx-code-block my-4', className)}
        dangerouslySetInnerHTML={{ __html: html.dark }}
      />
    );
  }
  return (
    <div className={cn('mdx-code-block my-4 contents', className)}>
      <div
        className="mdx-code-block-light"
        dangerouslySetInnerHTML={{ __html: html.light }}
      />
      <div
        className="mdx-code-block-dark"
        dangerouslySetInnerHTML={{ __html: html.dark }}
      />
    </div>
  );
}
