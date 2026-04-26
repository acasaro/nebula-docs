import { useId, useState, type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

export interface AccordionProps {
  title: ReactNode;
  description?: string;
  defaultOpen?: boolean;
  icon?: ReactNode;
  className?: string;
  children?: ReactNode;
}

/**
 * Mintlify-style Accordion. A single collapsible disclosure built on the
 * native `<details>` element with a styled summary. URL state sync from the
 * vendor implementation is dropped for Phase 3 — re-add when we wire up
 * deep linking.
 */
export function Accordion({
  title,
  description,
  defaultOpen = false,
  icon,
  className,
  children,
}: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  const contentId = `${id}-content`;
  const titleId = `${id}-label`;

  return (
    <details
      className={cn(
        'mb-3 cursor-default overflow-hidden rounded-2xl border border-stone-200/70 bg-white dark:border-white/10 dark:bg-stone-900/40',
        className,
      )}
      data-component-part="accordion"
      open={open}
      onToggle={(e) => {
        const next = (e.currentTarget as HTMLDetailsElement).open;
        if (next !== open) setOpen(next);
      }}
    >
      <summary
        aria-controls={contentId}
        aria-expanded={open}
        className="not-prose flex cursor-pointer list-none items-center gap-3 px-6 py-4 text-left text-stone-700 hover:bg-stone-50/50 dark:text-stone-200 dark:hover:bg-white/5 [&::-webkit-details-marker]:hidden"
        data-component-part="accordion-summary"
      >
        <ChevronRight
          aria-hidden="true"
          className={cn(
            'size-4 shrink-0 text-stone-400 transition-transform dark:text-stone-500',
            open && 'rotate-90',
          )}
        />
        {icon ? (
          <span className="size-4 shrink-0 text-stone-700 dark:text-stone-200">
            {icon}
          </span>
        ) : null}
        <div className="flex flex-col gap-0.5 leading-tight">
          <span id={titleId} className="font-semibold text-sm">
            {title}
          </span>
          {description ? (
            <span className="text-xs text-stone-500 dark:text-stone-400">
              {description}
            </span>
          ) : null}
        </div>
      </summary>
      <div
        role="region"
        aria-labelledby={titleId}
        className="prose prose-stone dark:prose-invert mx-6 mb-4 mt-2 cursor-default overflow-x-auto"
        data-component-part="accordion-content"
        id={contentId}
      >
        {children}
      </div>
    </details>
  );
}

export interface AccordionGroupProps {
  children?: ReactNode;
  className?: string;
}

/**
 * Wraps a stack of `<Accordion>` items so they share visual borders.
 */
export function AccordionGroup({ children, className }: AccordionGroupProps) {
  return (
    <div
      className={cn(
        'prose prose-stone dark:prose-invert mb-3 mt-0 overflow-hidden rounded-xl border border-stone-200/70 dark:border-white/10',
        '[&>details]:mb-0 [&>details]:rounded-none [&>details]:border-0',
        '[&>details+details]:border-t [&>details+details]:border-t-stone-200/70 dark:[&>details+details]:border-t-white/10',
        className,
      )}
      data-component-part="accordion-group"
    >
      {children}
    </div>
  );
}
