import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { cn } from '@/lib/utils';
import type { SlashItem } from './slashItems';

export interface SlashMenuRef {
  onKeyDown: (event: KeyboardEvent) => boolean;
}

export interface SlashMenuProps {
  items: SlashItem[];
  command: (item: SlashItem) => void;
}

export const SlashMenu = forwardRef<SlashMenuRef, SlashMenuProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useEffect(() => {
      itemRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }, [selectedIndex]);

    useImperativeHandle(ref, () => ({
      onKeyDown: (event) => {
        if (event.key === 'ArrowUp') {
          setSelectedIndex(
            (i) => (i - 1 + items.length) % Math.max(items.length, 1),
          );
          return true;
        }
        if (event.key === 'ArrowDown') {
          setSelectedIndex((i) => (i + 1) % Math.max(items.length, 1));
          return true;
        }
        if (event.key === 'Enter') {
          const item = items[selectedIndex];
          if (item) command(item);
          return true;
        }
        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="rounded-md border bg-popover p-3 text-sm text-muted-foreground shadow-lg">
          No matches
        </div>
      );
    }

    return (
      <div
        className="max-h-72 min-w-[260px] overflow-y-auto rounded-md border bg-popover p-1 shadow-lg"
        role="listbox"
      >
        {items.map((item, i) => {
          const Icon = item.Icon;
          return (
            <button
              key={item.id}
              ref={(el) => {
                itemRefs.current[i] = el;
              }}
              type="button"
              role="option"
              aria-selected={i === selectedIndex}
              className={cn(
                'flex w-full items-start gap-3 rounded-sm px-2 py-1.5 text-left',
                'hover:bg-accent hover:text-accent-foreground',
                i === selectedIndex && 'bg-accent text-accent-foreground',
              )}
              onMouseEnter={() => setSelectedIndex(i)}
              onClick={() => command(item)}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border bg-background',
                  'text-muted-foreground',
                )}
              >
                <Icon className="size-4" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="text-sm font-medium leading-tight">
                  {item.label}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {item.description}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    );
  },
);
SlashMenu.displayName = 'SlashMenu';
