import {
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';

export type TooltipSide = 'top' | 'bottom' | 'left' | 'right';
export type TooltipAlign = 'start' | 'center' | 'end';

export interface TooltipProps {
  children: ReactNode;
  title?: string;
  description?: string;
  cta?: string;
  href?: string;
  side?: TooltipSide;
  align?: TooltipAlign;
  className?: string;
}

const REMOTE_URL_RE = /^(?:https?:)?\/\//i;

export function Tooltip({
  children,
  title,
  description,
  cta,
  href,
  side = 'top',
  align = 'center',
  className,
}: TooltipProps) {
  const tooltipId = useId();
  const [pinned, setPinned] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!pinned) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPinned(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setPinned(false);
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClickOutside);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClickOutside);
    };
  }, [pinned]);

  if (children == null) return null;
  if (!title && !description) return <>{children}</>;

  const triggerLabel =
    title && description ? `${title}: ${description}` : title || description || undefined;
  const isExternal = href ? REMOTE_URL_RE.test(href) : false;
  const interactiveChild = isInteractiveElement(children);

  const triggerClass = cn(
    'rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
    !interactiveChild &&
      'cursor-help underline decoration-2 decoration-stone-400 decoration-dotted underline-offset-4 dark:decoration-stone-400',
    className,
  );

  const trigger = interactiveChild ? (
    cloneElement(children as ReactElement<{ className?: string; 'aria-describedby'?: string }>, {
      'aria-describedby': tooltipId,
      className: cn(
        (children as ReactElement<{ className?: string }>).props.className,
        triggerClass,
      ),
    })
  ) : (
    <span
      tabIndex={0}
      role="button"
      aria-describedby={tooltipId}
      aria-label={triggerLabel}
      onClick={() => setPinned((p) => !p)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setPinned((p) => !p);
        }
      }}
      className={triggerClass}
    >
      {children}
    </span>
  );

  return (
    <span
      ref={wrapperRef}
      data-component-part="tooltip"
      data-pinned={pinned ? '' : undefined}
      className="group/tooltip relative inline-flex"
    >
      {trigger}
      <span
        id={tooltipId}
        role="tooltip"
        data-component-part="tooltip-content"
        className={cn(
          'pointer-events-none absolute z-50 flex w-max max-w-[16rem] flex-col gap-1 rounded-xl border border-stone-200 bg-white px-4 py-3 opacity-0 shadow-[0_10px_16px_-3px_rgb(10_10_10/0.05),0_3px_10px_-2px_rgb(10_10_10/0.02)] transition-opacity duration-100 dark:border-stone-900 dark:bg-stone-950',
          'group-hover/tooltip:pointer-events-auto group-hover/tooltip:opacity-100 group-focus-within/tooltip:pointer-events-auto group-focus-within/tooltip:opacity-100',
          'group-data-[pinned]/tooltip:pointer-events-auto group-data-[pinned]/tooltip:opacity-100',
          sidePlacement[side],
          alignPlacement[side][align],
        )}
      >
        {title ? (
          <span
            data-component-part="tooltip-title"
            className="font-medium text-stone-900 text-xs leading-4 dark:text-stone-200"
          >
            {title}
          </span>
        ) : null}
        {description ? (
          <span
            data-component-part="tooltip-description"
            className="text-stone-600 text-xs leading-4 dark:text-stone-400"
          >
            {description}
          </span>
        ) : null}
        {cta && href ? (
          <a
            href={href}
            {...(isExternal ? { target: '_blank', rel: 'noreferrer' } : {})}
            data-component-part="tooltip-cta"
            className="mt-2 flex items-center gap-0.5 rounded-sm font-medium text-stone-600 text-xs leading-4 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:text-stone-400 dark:hover:text-primary"
          >
            {cta}
            <ChevronRight aria-hidden="true" className="size-3" strokeWidth={2.5} />
          </a>
        ) : null}
      </span>
    </span>
  );
}

const sidePlacement: Record<TooltipSide, string> = {
  top: 'bottom-full mb-1',
  bottom: 'top-full mt-1',
  left: 'right-full mr-1',
  right: 'left-full ml-1',
};

const alignPlacement: Record<TooltipSide, Record<TooltipAlign, string>> = {
  top: {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  },
  bottom: {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  },
  left: {
    start: 'top-0',
    center: 'top-1/2 -translate-y-1/2',
    end: 'bottom-0',
  },
  right: {
    start: 'top-0',
    center: 'top-1/2 -translate-y-1/2',
    end: 'bottom-0',
  },
};

function isInteractiveElement(node: ReactNode): boolean {
  if (!isValidElement(node)) return false;
  const type = node.type;
  if (typeof type === 'function' || typeof type === 'object') return true;
  if (typeof type === 'string') {
    return ['a', 'button', 'input', 'select', 'textarea'].includes(type.toLowerCase());
  }
  return false;
}
