import React, { useMemo, type ReactNode } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Trash2, X, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AttributesPopoverProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** DOM element the popover anchors to (typically the right-side trigger). */
  anchorEl: HTMLElement | null;
  title: string;
  titleIcon?: LucideIcon;
  onDelete: () => void;
  children: ReactNode;
}

export function AttributesPopover({
  open,
  onOpenChange,
  anchorEl,
  title,
  titleIcon: TitleIcon,
  onDelete,
  children,
}: AttributesPopoverProps) {
  const virtualRef = useMemo(
    () => ({
      current: anchorEl
        ? {
            getBoundingClientRect: () => {
              const r = anchorEl.getBoundingClientRect();
              return new DOMRect(r.right, r.top, 0, r.height);
            },
          }
        : null,
    }),
    [anchorEl],
  ) as React.RefObject<{ getBoundingClientRect: () => DOMRect }>;

  if (!anchorEl) return null;

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Anchor virtualRef={virtualRef} />
      <Popover.Portal>
        <Popover.Content
          side="left"
          align="start"
          sideOffset={12}
          collisionPadding={12}
          sticky="always"
          className={cn(
            'z-50 flex w-[350px] flex-col rounded-lg border bg-popover shadow-xl',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <header className="flex items-center justify-between gap-2 border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              {TitleIcon ? (
                <TitleIcon className="size-4 text-muted-foreground" />
              ) : null}
              <h3 className="text-sm font-semibold">{title}</h3>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              aria-label="Close"
            >
              <X className="size-3.5" />
            </button>
          </header>
          <div className="flex flex-col gap-5 px-4 py-4">{children}</div>
          <footer className="flex items-center justify-end gap-2 border-t border-border/60 px-3 py-2.5">
            <button
              type="button"
              onClick={onDelete}
              className="flex size-8 items-center justify-center rounded text-destructive transition-colors hover:bg-destructive/10"
              aria-label="Delete block"
            >
              <Trash2 className="size-4" />
            </button>
            <Button
              size="sm"
              onClick={() => onOpenChange(false)}
              className="bg-foreground text-background hover:bg-foreground/90"
            >
              Save Changes
            </Button>
          </footer>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
