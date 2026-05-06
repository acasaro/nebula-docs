import {
  Children,
  isValidElement,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';

export interface CodeGroupProps {
  children?: ReactNode;
  /** Render the language switcher as a dropdown instead of a tab strip. */
  dropdown?: boolean;
  defaultIndex?: number;
  className?: string;
}

interface CodeChildProps {
  filename?: string;
  language?: string;
  code?: string;
}

const FALLBACK_TAB_PREFIX = 'Tab';

/**
 * Tabbed group for sibling code blocks. Each child is expected to be a
 * `<CodeBlock>` (or anything that exposes `filename` / `language` / `code`
 * props) and provides one tab. The active child renders unchanged; the
 * others are detached so they don't show simultaneously.
 *
 * Usage:
 *   <CodeGroup>
 *     ```javascript helloWorld.js
 *     console.log('hi');
 *     ```
 *     ```python hello_world.py
 *     print('hi')
 *     ```
 *   </CodeGroup>
 *
 * The MDX renderer is responsible for converting fenced code blocks into
 * `<CodeBlock filename="..." language="..." code="..." />` children before
 * they reach this component.
 */
export function CodeGroup({
  children,
  dropdown,
  defaultIndex = 0,
  className,
}: CodeGroupProps) {
  const items = useMemo(
    () =>
      Children.toArray(children).filter((c): c is ReactElement<CodeChildProps> =>
        isValidElement(c),
      ),
    [children],
  );

  const safeDefault =
    items.length === 0
      ? 0
      : Math.max(0, Math.min(defaultIndex, items.length - 1));
  const [active, setActive] = useState(safeDefault);

  if (items.length === 0) return null;
  const clamped = Math.min(active, items.length - 1);

  const labelFor = (item: ReactElement<CodeChildProps>, index: number) =>
    item.props.filename ?? item.props.language ?? `${FALLBACK_TAB_PREFIX} ${index + 1}`;

  return (
    <div
      className={cn(
        'not-prose relative my-5 overflow-hidden rounded-2xl border border-stone-950/10 dark:border-white/10',
        className,
      )}
      data-component-part="code-group"
    >
      <div
        className={cn(
          'flex items-center gap-2 border-b border-stone-200/70 bg-stone-50 dark:border-white/10 dark:bg-stone-900/40',
          dropdown ? 'px-2.5 py-1.5' : 'pr-2.5',
        )}
        data-component-part="code-group-header"
      >
        {dropdown ? (
          <DropdownTabSwitcher
            items={items}
            active={clamped}
            onChange={setActive}
            labelFor={labelFor}
          />
        ) : (
          <div
            role="tablist"
            className="flex w-0 flex-1 gap-1 overflow-x-auto text-xs leading-6"
          >
            {items.map((item, i) => {
              const isActive = i === clamped;
              return (
                <button
                  key={`${labelFor(item, i)}-${i}`}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive(i)}
                  className={cn(
                    'group relative my-1 mb-1.5 flex max-w-max items-center gap-1.5 whitespace-nowrap font-medium outline-0 first:ml-2.5',
                    isActive
                      ? 'text-primary dark:text-primary-light'
                      : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200',
                  )}
                  data-component-part="code-group-tab"
                  data-active={isActive}
                >
                  <span
                    className={cn(
                      'z-10 flex items-center gap-1.5 rounded-lg px-1.5',
                      items.length > 1 &&
                        'group-hover:bg-stone-200/50 dark:group-hover:bg-stone-700/70',
                    )}
                  >
                    {labelFor(item, i)}
                  </span>
                  {isActive ? (
                    <span className="absolute right-0 -bottom-1.5 left-0 h-0.5 rounded-full bg-primary dark:bg-primary-light" />
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div data-component-part="code-group-panels">
        {items.map((item, i) => (
          <div
            key={`panel-${i}`}
            role="tabpanel"
            aria-hidden={i !== clamped}
            hidden={i !== clamped}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function DropdownTabSwitcher({
  items,
  active,
  onChange,
  labelFor,
}: {
  items: ReactElement<CodeChildProps>[];
  active: number;
  onChange: (next: number) => void;
  labelFor: (item: ReactElement<CodeChildProps>, index: number) => string;
}) {
  const [open, setOpen] = useState(false);
  const current = items[active];
  const currentLabel = current ? labelFor(current, active) : '';
  return (
    <div className="relative flex flex-1 items-center text-xs">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onBlur={() => setOpen(false)}
        className="flex items-center gap-1.5 rounded-md px-2 py-1 font-medium text-stone-700 hover:bg-stone-200/70 dark:text-stone-200 dark:hover:bg-stone-700/40"
      >
        <span className="truncate">{currentLabel}</span>
        <ChevronDown className="size-3.5" aria-hidden="true" />
      </button>
      {open ? (
        <ul
          role="listbox"
          className="absolute top-full left-0 z-20 mt-1 min-w-[180px] rounded-md border border-stone-200/70 bg-white py-1 shadow-md dark:border-white/10 dark:bg-stone-900"
        >
          {items.map((item, i) => (
            <li key={`option-${i}`}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(i);
                  setOpen(false);
                }}
                className={cn(
                  'flex w-full items-center px-3 py-1 text-left text-xs',
                  i === active
                    ? 'bg-stone-100 font-semibold dark:bg-stone-800'
                    : 'hover:bg-stone-100 dark:hover:bg-stone-800',
                )}
              >
                {labelFor(item, i)}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
