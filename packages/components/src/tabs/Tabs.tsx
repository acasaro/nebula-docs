import {
  Children,
  isValidElement,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '../utils/cn';

export interface TabProps {
  title: string;
  id?: string;
  children?: ReactNode;
}

/**
 * Marker component — `<Tabs>` reads its children's props to render the tab
 * list. `<Tab>` itself doesn't render anything when used standalone.
 */
export function Tab(_props: TabProps): null {
  return null;
}

export interface TabsProps {
  children?: ReactNode;
  defaultTabIndex?: number;
  className?: string;
  ariaLabel?: string;
}

const DEFAULT_TAB_TITLE = 'Tab';

export function Tabs({
  children,
  defaultTabIndex = 0,
  className,
  ariaLabel = 'Tabs',
}: TabsProps) {
  const items = useMemo(
    () =>
      Children.toArray(children).filter((c): c is ReactElement<TabProps> =>
        isValidElement(c),
      ),
    [children],
  );

  const safeDefault =
    items.length === 0
      ? 0
      : Math.max(0, Math.min(defaultTabIndex, items.length - 1));
  const [active, setActive] = useState(safeDefault);

  const handleKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (items.length === 0) return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      const next =
        e.key === 'ArrowLeft'
          ? (index - 1 + items.length) % items.length
          : (index + 1) % items.length;
      setActive(next);
    } else if (e.key === 'Home') {
      e.preventDefault();
      setActive(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setActive(items.length - 1);
    }
  };

  if (items.length === 0) {
    return null;
  }

  return (
    <div className={cn('tab-container my-4', className)} data-component-part="tabs">
      <div
        role="tablist"
        aria-label={ariaLabel}
        className="not-prose mb-4 flex min-w-full flex-none gap-x-6 overflow-auto border-b border-stone-200 dark:border-stone-700"
        data-component-part="tabs-list"
      >
        {items.map((child, i) => {
          const title = child.props.title ?? DEFAULT_TAB_TITLE;
          const isActive = i === active;
          return (
            <button
              key={child.props.id ?? `${title}-${i}`}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(i)}
              onKeyDown={(e) => handleKeyDown(e, i)}
              className={cn(
                '-mb-px flex max-w-max items-center gap-1.5 whitespace-nowrap border-b pt-3 pb-2.5 text-sm font-semibold leading-6 transition-colors',
                isActive
                  ? 'border-current text-stone-900 dark:text-stone-100'
                  : 'border-transparent text-stone-600 hover:text-stone-900 hover:border-stone-300 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:border-stone-700',
              )}
              data-component-part="tab-button"
              data-active={isActive}
            >
              {title}
            </button>
          );
        })}
      </div>
      <div data-component-part="tabs-panels">
        {items.map((child, i) => {
          const isActive = i === active;
          return (
            <div
              key={child.props.id ?? `panel-${i}`}
              role="tabpanel"
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
              hidden={!isActive}
              className="prose dark:prose-invert overflow-x-auto"
              data-component-part="tab-content"
            >
              {child.props.children}
            </div>
          );
        })}
      </div>
    </div>
  );
}
