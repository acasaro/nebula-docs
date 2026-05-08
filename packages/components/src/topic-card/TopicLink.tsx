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
      className={cn(
        'flex items-center justify-between gap-2 py-3.5 text-sm font-medium',
        'border-b border-stone-950/[.04] last:border-b-0 dark:border-white/[.06]',
        'no-underline transition-colors',
        'text-[var(--mcoe-brand-primary)] hover:text-[var(--mcoe-brand-primary-dark)] hover:underline',
        className,
      )}
      data-component-part="topic-link"
    >
      <span className="truncate">{label}</span>
      <ChevronRight className="size-4 shrink-0 text-stone-950/[.18] dark:text-white/[.22]" />
    </Component>
  );
}
