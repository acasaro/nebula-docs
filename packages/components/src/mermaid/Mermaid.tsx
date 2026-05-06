import { useEffect, useId, useState } from 'react';
import { cn } from '../utils/cn';

export interface MermaidProps {
  /** Inline diagram source. Caller can also pass it as `children` (string). */
  chart?: string;
  children?: string;
  className?: string;
  ariaLabel?: string;
}

/**
 * Renders a Mermaid diagram. Lazy-loads the `mermaid` library on first render
 * so the ~600KB cost is only paid by pages that actually use diagrams.
 *
 * The vendor implementation adds pan-zoom + ZoomControls; we ship a static
 * SVG view for Phase 3 and re-add controls when editor UX needs them.
 */
export function Mermaid({ chart, children, className, ariaLabel = 'Mermaid diagram' }: MermaidProps) {
  const source =
    chart ?? (typeof children === 'string' ? children : '') ?? '';
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const id = useId();

  useEffect(() => {
    if (!source.trim()) {
      setSvg('');
      setError(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const m = (await import('mermaid')).default;
        // Platform uses `.dark` on <html>; CLI uses `[data-theme="dark"]`.
        // Match either so the diagram theme tracks the page theme regardless
        // of which consumer is rendering.
        const isDark =
          typeof document !== 'undefined' &&
          (document.documentElement.classList.contains('dark') ||
            document.documentElement.getAttribute('data-theme') === 'dark');
        m.initialize({
          startOnLoad: false,
          theme: isDark ? 'dark' : 'default',
          fontFamily: 'inherit',
        });
        const renderId = `mermaid-${id.replace(/:/g, '')}-${Date.now()}`;
        const { svg: rendered } = await m.render(renderId, source);
        if (!cancelled) {
          setSvg(rendered);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to render diagram');
          setSvg('');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source, id]);

  if (error) {
    return (
      <div
        className={cn(
          'my-4 rounded-md border border-destructive/40 bg-destructive/5 p-4 font-mono text-xs text-destructive',
          className,
        )}
        data-component-part="mermaid-error"
      >
        Mermaid render failed: {error}
      </div>
    );
  }

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className={cn(
        'my-4 flex justify-center overflow-x-auto rounded-2xl border border-stone-200/70 bg-white p-4 dark:border-white/10 dark:bg-stone-900/40',
        className,
      )}
      data-component-part="mermaid"
      // mermaid renders trusted SVG output from controlled source
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
