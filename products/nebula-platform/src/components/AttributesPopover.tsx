import React, { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Trash2, X, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const VIEWPORT_PADDING = 12;
const SIDE_OFFSET = 12;
// Hard-coded to match the popover's `w-[350px]` class. Used at open time to
// decide whether the modal can fit to the right of the anchor.
const POPOVER_WIDTH = 350;

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
  const contentRef = useRef<HTMLDivElement | null>(null);

  // Decide once at open time whether the modal fits to the right of the
  // anchor. If yes, place it there (out of the way of edited content); if
  // not, fall back to the original left placement that overlays content.
  // We don't re-decide on scroll/resize so the side doesn't flip while the
  // modal is open.
  const [side, setSide] = useState<'left' | 'right'>('left');
  useEffect(() => {
    if (!open || !anchorEl) return;
    const anchorRight = anchorEl.getBoundingClientRect().right;
    const rightSpace = window.innerWidth - anchorRight - VIEWPORT_PADDING;
    setSide(rightSpace >= POPOVER_WIDTH + SIDE_OFFSET ? 'right' : 'left');
  }, [open, anchorEl]);

  // Bump on scroll so the virtualRef object reference changes and Radix
  // re-runs positioning. Floating UI's ancestorScroll walks the floating
  // element's ancestors — since we portal to body, the editor's scroll
  // container isn't in that chain, so scroll there doesn't trigger an
  // autoUpdate. A capture-phase window listener catches descendant
  // scrolls, rAF-throttled so we re-position at most once per frame.
  const [scrollTick, setScrollTick] = useState(0);
  useEffect(() => {
    if (!open) return;
    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        setScrollTick((t) => t + 1);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => {
      window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [open]);

  // The popover follows the anchor block as the page scrolls, but its top
  // is clamped to the viewport so the whole modal stays visible. As the
  // anchor scrolls past the viewport edge the modal's top (or bottom)
  // sticks to the window edge instead of riding the anchor off-screen.
  const virtualRef = useMemo(
    () => ({
      current: anchorEl
        ? {
            getBoundingClientRect: () => {
              const anchor = anchorEl.getBoundingClientRect();
              const h = contentRef.current?.getBoundingClientRect().height ?? 0;
              const vh = window.innerHeight;

              let top = anchor.top;
              if (h > 0 && h + VIEWPORT_PADDING * 2 <= vh) {
                const minTop = VIEWPORT_PADDING;
                const maxTop = vh - h - VIEWPORT_PADDING;
                top = Math.max(minTop, Math.min(top, maxTop));
              }
              return new DOMRect(anchor.right, top, 0, 0);
            },
          }
        : null,
    }),
    [anchorEl, scrollTick],
  ) as React.RefObject<{ getBoundingClientRect: () => DOMRect }>;

  if (!anchorEl) return null;

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Anchor virtualRef={virtualRef} />
      <Popover.Portal>
        <Popover.Content
          ref={contentRef}
          side={side}
          align="start"
          sideOffset={SIDE_OFFSET}
          collisionPadding={VIEWPORT_PADDING}
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
