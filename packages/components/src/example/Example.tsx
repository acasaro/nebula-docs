import type { ReactNode } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, Trash, X } from 'lucide-react';
import { cn } from '../utils/cn';

type ExampleVariant = 'request' | 'response';

interface ExampleBaseProps {
  title?: string;
  className?: string;
  children?: ReactNode;
}

interface ExampleProps extends ExampleBaseProps {
  variant: ExampleVariant;
}

const variantConfig: Record<
  ExampleVariant,
  {
    earBg: string;
    earIcon: typeof ArrowUpRight;
    earLabel: string;
    tabLabel: string;
    tabText: string;
    tabUnderline: string;
  }
> = {
  request: {
    earBg: 'bg-emerald-600',
    earIcon: ArrowUpRight,
    earLabel: 'Request example',
    tabLabel: 'Request',
    tabText: 'text-emerald-600 dark:text-emerald-400',
    tabUnderline: 'bg-emerald-500 dark:bg-emerald-400',
  },
  response: {
    earBg: 'bg-sky-600',
    earIcon: ArrowDownLeft,
    earLabel: 'Response example',
    tabLabel: 'Response',
    tabText: 'text-sky-600 dark:text-sky-400',
    tabUnderline: 'bg-sky-500 dark:bg-sky-400',
  },
};

/**
 * Mintlify-style API example wrapper. Two visual pieces:
 *
 *   1) An "ear" — a folder-tab-shaped colored label at the top-left
 *      (`rounded-t-xl` only), labelled "Request example" / "Response example"
 *      with a directional arrow icon.
 *   2) The main card — `rounded-2xl rounded-tl-none` so the top-left corner
 *      is flat and mates with the ear. Inside:
 *      - a tab row showing the example name with a colored underline
 *        indicator and an `×` close button, plus `+`/trash actions on the
 *        right (visual placeholders — Phase 4+ wires them up)
 *      - a nested code-block area with its own light/dark surface
 *
 * MDX usage stays simple: pass a fenced code block as children. Multi-tab
 * support (Mintlify renders multiple language tabs) lands when we add edit
 * affordances.
 */
function Example({ title, className, children, variant }: ExampleProps) {
  const cfg = variantConfig[variant];
  const EarIcon = cfg.earIcon;
  const tabLabel = title ?? cfg.tabLabel;

  return (
    <div
      className={cn('mt-5 mb-8', className)}
      data-component-part={
        variant === 'request' ? 'request-example' : 'response-example'
      }
    >
      <div
        className={cn(
          'flex w-fit items-center justify-center rounded-t-xl px-3 py-1.5 text-xs font-medium text-white',
          cfg.earBg,
        )}
      >
        <EarIcon className="mr-2 size-3" aria-hidden="true" />
        {cfg.earLabel}
      </div>

      <div className="relative flex flex-col overflow-hidden rounded-2xl rounded-tl-none border border-stone-950/10 bg-stone-50 p-0.5 dark:border-white/10 dark:bg-white/5">
        <div className="relative flex items-center justify-between gap-2 pr-2.5">
          <div
            role="tablist"
            aria-orientation="horizontal"
            className="flex flex-1 gap-1 overflow-x-auto px-2.5 text-xs leading-6"
          >
            <div
              role="tab"
              aria-selected="true"
              tabIndex={0}
              className={cn(
                'group relative my-1 mb-1.5 flex items-center gap-1.5 whitespace-nowrap font-medium outline-none',
                cfg.tabText,
              )}
            >
              <div className="z-10 flex cursor-text items-center gap-1.5 rounded-lg px-1.5">
                <span className="text-xs font-medium">{tabLabel}</span>
                <button
                  type="button"
                  className="p-0 opacity-60 transition-opacity hover:opacity-100"
                  aria-label={`Remove ${tabLabel}`}
                >
                  <X className="size-3" />
                </button>
              </div>
              <div
                className={cn(
                  'absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full',
                  cfg.tabUnderline,
                )}
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end">
            <button
              type="button"
              aria-label={`Add ${cfg.tabLabel.toLowerCase()}`}
              className="flex size-8 items-center justify-center rounded-[10px] text-stone-500 transition-colors hover:bg-stone-950/5 dark:text-stone-400 dark:hover:bg-white/5"
            >
              <Plus className="size-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={`Delete ${cfg.tabLabel.toLowerCase()}`}
              className="flex size-8 items-center justify-center rounded-[10px] text-stone-500 transition-colors hover:bg-stone-950/5 dark:text-stone-400 dark:hover:bg-white/5"
            >
              <Trash className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex w-full flex-1 overflow-hidden">
          <div
            className={cn(
              'w-full min-w-full overflow-x-auto rounded-[14px] bg-white px-4 py-3.5 dark:bg-stone-950',
              // Strip the inner code block's chrome so it renders clean
              // inside this card.
              '[&_pre]:my-0 [&_pre]:rounded-none [&_pre]:border-0 [&_pre]:bg-transparent [&_pre]:p-0',
              // Hide the lang/meta header — the tab above is the label.
              '[&_pre>div:first-child]:hidden',
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export interface RequestExampleProps extends ExampleBaseProps {}
export interface ResponseExampleProps extends ExampleBaseProps {}

export function RequestExample(props: RequestExampleProps) {
  return <Example {...props} variant="request" />;
}

export function ResponseExample(props: ResponseExampleProps) {
  return <Example {...props} variant="response" />;
}
