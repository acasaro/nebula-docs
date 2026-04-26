import { useId, useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

export interface ExpandableProps {
  title?: string;
  defaultOpen?: boolean;
  openedText?: string;
  closedText?: string;
  className?: string;
  children?: ReactNode;
}

const DEFAULT_OPENED_TEXT = 'Hide';
const DEFAULT_CLOSED_TEXT = 'Show';
const DEFAULT_TITLE = 'child attributes';

/**
 * Mintlify-style Expandable. A flatter disclosure than Accordion — used
 * primarily for nested-property documentation where you want the summary
 * to read "Show {title}" / "Hide {title}".
 */
export function Expandable({
  title = DEFAULT_TITLE,
  defaultOpen = false,
  openedText = DEFAULT_OPENED_TEXT,
  closedText = DEFAULT_CLOSED_TEXT,
  className,
  children,
}: ExpandableProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const contentId = `${id}-content`;

  return (
    <details
      className={cn(
        'mt-4 rounded-xl border border-stone-200/70 dark:border-white/10',
        className,
      )}
      data-component-part="expandable"
      open={open}
      onToggle={(e) => {
        const next = (e.currentTarget as HTMLDetailsElement).open;
        if (next !== open) setOpen(next);
      }}
    >
      <summary
        aria-controls={contentId}
        aria-expanded={open}
        className={cn(
          'not-prose flex w-full cursor-pointer list-none items-center px-3.5 py-3 text-sm rounded-t-xl text-stone-600 hover:bg-stone-50/50 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-white/5 dark:hover:text-stone-200 [&::-webkit-details-marker]:hidden',
          !open && 'rounded-b-xl',
        )}
        data-component-part="expandable-button"
      >
        <ChevronRight
          aria-hidden="true"
          className={cn(
            'size-3.5 shrink-0 text-stone-400 transition-transform',
            open && 'rotate-90',
          )}
        />
        <p className="m-0 ml-3 leading-tight">
          {open ? openedText : closedText} {title}
        </p>
      </summary>
      <div
        className="border-t border-stone-100 px-3.5 py-3 dark:border-white/10 [&_:is(p,ul,ol,blockquote)]:m-0 [&_:is(p,ul,ol,blockquote)+:is(p,ul,ol,blockquote)]:mt-2"
        data-component-part="expandable-content"
        id={contentId}
      >
        {children}
      </div>
    </details>
  );
}
