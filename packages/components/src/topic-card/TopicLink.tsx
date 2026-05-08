import { ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

export interface TopicLinkProps {
  label?: string;
  href?: string;
  className?: string;
}

/**
 * One row in a `TopicCard`'s link list. Renders as `<a>` when `href` is
 * set, otherwise a non-clickable `<div>` (so the editor can render
 * placeholder rows that won't navigate).
 */
export function TopicLink({ label = '', href, className }: TopicLinkProps) {
  const Component = href ? 'a' : ('div' as const);
  return (
    <Component
      href={href}
      style={{ color: 'var(--brand-blue-mid)' }}
      className={cn(
        'flex items-center justify-between gap-2 py-3 text-sm font-medium',
        'border-b border-stone-200/60 last:border-b-0 dark:border-stone-700/40',
        'no-underline transition-colors',
        href && 'hover:underline',
        className,
      )}
      data-component-part="topic-link"
    >
      <span className="truncate">{label}</span>
      <ChevronRight className="size-4 shrink-0 text-stone-200/60 dark:text-stone-700/40" />
    </Component>
  );
}
