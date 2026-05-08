import type { CSSProperties } from 'react';
import { cn } from '../utils/cn';

export const STAGE_STATUSES = ['done', 'active', 'pending', 'blocked'] as const;
export type StageStatus = (typeof STAGE_STATUSES)[number];

export interface StageProps {
  label?: string;
  status?: StageStatus;
  meta?: string;
  className?: string;
}

const STATUS_BG: Record<StageStatus, string> = {
  done: 'var(--brand-green-lightest)',
  active: 'var(--brand-blue-lightest)',
  pending: 'color-mix(in srgb, var(--brand-neutral-light) 50%, white)',
  blocked: 'var(--brand-red-light)',
};

const STATUS_DOT: Record<StageStatus, string> = {
  done: 'var(--brand-green-mid)',
  active: 'var(--brand-blue-mid)',
  pending: 'var(--brand-neutral-dark)',
  blocked: 'var(--brand-red-mid)',
};

const STATUS_TEXT: Record<StageStatus, string> = {
  done: 'var(--brand-green-dark)',
  active: 'var(--brand-blue-dark)',
  pending: 'var(--brand-neutral-dark)',
  blocked: 'var(--brand-red-dark)',
};

/**
 * One row in a `StageList`. The `status` enum drives bg/dot/text colour
 * via brand-palette tokens — no freeform colour. `meta` is plain text
 * (per spec; never a link) shown right-aligned at smaller size.
 */
export function Stage({
  label = 'Stage',
  status = 'pending',
  meta,
  className,
}: StageProps) {
  const resolved = STAGE_STATUSES.includes(status) ? status : 'pending';

  return (
    <div
      style={
        {
          '--stage-bg': STATUS_BG[resolved],
          '--stage-dot': STATUS_DOT[resolved],
          '--stage-text': STATUS_TEXT[resolved],
        } as CSSProperties
      }
      className={cn(
        'flex items-center gap-3 rounded-lg px-4 py-5',
        'bg-[var(--stage-bg)] text-[var(--stage-text)]',
        className,
      )}
      data-component-part="stage"
      data-status={resolved}
    >
      <span
        className="size-2.5 shrink-0 rounded-full bg-[var(--stage-dot)]"
        data-component-part="stage-dot"
      />
      <span
        className="min-w-0 flex-1 truncate text-sm font-medium"
        data-component-part="stage-label"
      >
        {label}
      </span>
      {meta ? (
        <span
          className="shrink-0 text-xs opacity-80"
          data-component-part="stage-meta"
        >
          {meta}
        </span>
      ) : null}
    </div>
  );
}
