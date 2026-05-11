import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react';
import { FileText, type LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  filterPageSuggestions,
  usePageSuggestions,
  type PageSuggestion,
} from '@/lib/pageSuggestions';
import { cn } from '@/lib/utils';

interface PageLinkFieldProps {
  label: string;
  icon?: LucideIcon;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  trailing?: ReactNode;
}

/**
 * URL field for component attributes (Card.href, FeatureCard.linkUrl, etc.)
 * that surfaces the tenant's existing doc pages as suggestions while the user
 * types. Falls back to a plain URL input when no page list is available, so
 * pre-config tenants or external repos still work.
 */
export function PageLinkField({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder = 'Paste a URL or search pages…',
  className,
  trailing,
}: PageLinkFieldProps) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const blurTimerRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const pages = usePageSuggestions();
  const matches = useMemo(
    () => filterPageSuggestions(pages, value),
    [pages, value],
  );
  const showSuggestions =
    open && pages.length > 0 && matches.length > 0;

  useEffect(() => {
    if (activeIndex >= matches.length) setActiveIndex(0);
  }, [activeIndex, matches.length]);

  useEffect(
    () => () => {
      if (blurTimerRef.current !== null) {
        window.clearTimeout(blurTimerRef.current);
      }
    },
    [],
  );

  const selectSuggestion = (s: PageSuggestion) => {
    onChange(s.url);
    setOpen(false);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape' && showSuggestions) {
      event.preventDefault();
      setOpen(false);
      return;
    }
    if (!showSuggestions) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % matches.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + matches.length) % matches.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const m = matches[activeIndex];
      if (m) selectSuggestion(m);
    }
  };

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label
        htmlFor={id}
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
      >
        {Icon ? <Icon className="size-3.5" /> : null}
        {label}
      </Label>
      <div className="relative flex items-stretch gap-2">
        <div className="relative flex-1 min-w-0">
          <Input
            id={id}
            ref={inputRef}
            type="url"
            value={value}
            placeholder={placeholder}
            onChange={(e) => {
              onChange(e.target.value);
              setOpen(true);
              setActiveIndex(0);
            }}
            onFocus={() => {
              if (pages.length > 0) setOpen(true);
            }}
            onBlur={() => {
              // Defer close so a click on a suggestion can intercept first.
              blurTimerRef.current = window.setTimeout(() => {
                setOpen(false);
                blurTimerRef.current = null;
              }, 120);
            }}
            onKeyDown={onKeyDown}
            className="h-9 w-full"
          />
          {showSuggestions ? (
            <div
              role="listbox"
              aria-label="Page suggestions"
              className={cn(
                'absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md shadow-md',
                'bg-popover ring-1 ring-border',
              )}
              onMouseDown={(event) => {
                event.preventDefault();
              }}
            >
              {matches.map((m, i) => (
                <button
                  key={m.url}
                  type="button"
                  role="option"
                  aria-selected={i === activeIndex}
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => selectSuggestion(m)}
                  className={cn(
                    'flex w-full items-center gap-2 px-2 py-1.5 text-left text-xs',
                    i === activeIndex
                      ? 'bg-accent text-foreground'
                      : 'text-muted-foreground hover:bg-accent/60',
                  )}
                >
                  <FileText className="size-3.5 shrink-0 opacity-70" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-foreground">{m.title}</span>
                    <span className="truncate font-mono text-[10px] opacity-70">
                      {m.url}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {trailing}
      </div>
    </div>
  );
}
