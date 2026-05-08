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
        'flex items-center justify-between gap-2 py-2 text-sm font-medium',
        'text-stone-700 no-underline dark:text-stone-300',
        href && 'hover:text-stone-950 dark:hover:text-white',
        className,
      )}
      data-component-part="topic-link"
    >
      <span className="truncate">{label}</span>
      <ChevronRight className="size-4 shrink-0 text-stone-400" />
    </Component>
  );
}
