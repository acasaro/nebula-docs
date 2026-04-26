import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface UpdateProps {
  label: string;
  description?: string;
  tags?: string[];
  className?: string;
  children?: ReactNode;
}

/**
 * Mintlify-style Update entry. A two-column layout (label + tags pinned to
 * the left, content on the right) intended for changelog-style stacks.
 *
 * The vendor version supports anchor-link copying, scroll-spy registration,
 * and `id`/`isVisible` props from a parent context. Phase 3 ships the
 * visual layout only — anchor + scroll integrations land later.
 */
export function Update({ label, description, tags, className, children }: UpdateProps) {
  const tagsArray = (tags ?? [])
    .map((tag) => tag.trim())
    .filter(Boolean);
  const uniqueTags = Array.from(new Set(tagsArray));

  return (
    <div
      className={cn(
        'update-container relative flex w-full flex-col items-start gap-2 py-8 lg:flex-row lg:gap-6',
        className,
      )}
      data-component-part="update"
    >
      <div className="flex w-full shrink-0 flex-col items-start justify-start lg:sticky lg:top-24 lg:w-[160px]">
        <div
          className="flex grow-0 items-center justify-center rounded-lg bg-primary/10 px-2 py-1 font-medium text-primary text-sm"
          data-component-part="update-label"
        >
          {label}
        </div>
        {uniqueTags.length > 0 ? (
          <div
            className="mt-3 flex flex-wrap gap-2 px-1 text-stone-500 text-sm dark:text-stone-400"
            data-component-part="update-tag-list"
          >
            {uniqueTags.map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-lg font-medium text-sm"
                data-component-part="update-tag"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        {description ? (
          <div
            className="wrap-break-word mt-3 max-w-[160px] px-1 text-stone-500 text-sm dark:text-stone-400"
            data-component-part="update-description"
          >
            {description}
          </div>
        ) : null}
      </div>

      <div className="max-w-full flex-1 overflow-hidden px-0.5">
        <div className="prose-sm dark:prose-invert" data-component-part="update-content">
          {children}
        </div>
      </div>
    </div>
  );
}
