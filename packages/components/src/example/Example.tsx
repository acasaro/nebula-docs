import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface ExampleProps {
  title?: string;
  className?: string;
  children?: ReactNode;
  variant: 'request' | 'response';
}

/**
 * Wrapper used by Mintlify-style API documentation. The MDX passes a code
 * block as children — we add a labeled header and a card frame around it.
 */
function Example({ title, className, children, variant }: ExampleProps) {
  const defaultLabel = variant === 'request' ? 'Request' : 'Response';
  const accent =
    variant === 'request'
      ? 'text-emerald-600 dark:text-emerald-400'
      : 'text-sky-600 dark:text-sky-400';

  return (
    <div
      className={cn(
        'my-4 overflow-hidden rounded-2xl border border-stone-200/70 bg-stone-50/40 dark:border-white/10 dark:bg-stone-900/40',
        className,
      )}
      data-component-part={variant === 'request' ? 'request-example' : 'response-example'}
    >
      <div
        className={cn(
          'border-b border-stone-200/70 bg-white/40 px-4 py-2 font-mono text-xs uppercase tracking-wide dark:border-white/10 dark:bg-stone-950/40',
          accent,
        )}
      >
        {title ?? defaultLabel}
      </div>
      <div className="prose prose-sm prose-stone dark:prose-invert max-w-none px-4 py-3">
        {children}
      </div>
    </div>
  );
}

export interface RequestExampleProps {
  title?: string;
  className?: string;
  children?: ReactNode;
}

export function RequestExample(props: RequestExampleProps) {
  return <Example {...props} variant="request" />;
}

export interface ResponseExampleProps {
  title?: string;
  className?: string;
  children?: ReactNode;
}

export function ResponseExample(props: ResponseExampleProps) {
  return <Example {...props} variant="response" />;
}
