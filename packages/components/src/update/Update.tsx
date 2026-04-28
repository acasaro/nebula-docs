import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface UpdateProps {
  label: string;
  description?: string;
  tags?: string | string[];
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
  // Tags can arrive from MDX as undefined, an array, or a comma-separated
  // string ("alpha, beta"). Anything else (e.g. unparsed expression
  // objects from our JSX attribute coercer) coerces safely to [].
  const tagsArray = Array.isArray(tags)
    ? tags.map((t) => String(t).trim()).filter(Boolean)
    : typeof tags === 'string'
      ? tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean)
      : [];
  const uniqueTags = Array.from(new Set(tagsArray));

  return (
    <div
      className={cn(
        'relative flex w-full items-start gap-6 py-6',
        className,
      )}
      data-component-part="update"
    >
      <div className="flex w-[140px] shrink-0 flex-col items-start">
        <span
          className="inline-flex items-center rounded-md bg-primary/10 px-2 py-1 text-sm font-medium text-primary"
          data-component-part="update-label"
        >
          {label}
        </span>
        {uniqueTags.length > 0 ? (
          <div
            className="mt-3 flex flex-wrap gap-2 px-1 text-sm text-stone-500 dark:text-stone-400"
            data-component-part="update-tag-list"
          >
            {uniqueTags.map((tag) => (
              <span
                key={tag}
                className="inline-block rounded-lg text-sm font-medium"
                data-component-part="update-tag"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        {description ? (
          <p
            className="mt-3 max-w-full px-1 text-sm text-stone-500 dark:text-stone-400"
            data-component-part="update-description"
          >
            {description}
          </p>
        ) : null}
      </div>

      <div className="min-w-0 flex-1" data-component-part="update-content">
        {children}
      </div>
    </div>
  );
}
