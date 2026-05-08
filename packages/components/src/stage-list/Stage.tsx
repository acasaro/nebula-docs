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
  pending: 'var(--brand-neutral-light)',
  blocked: 'var(--brand-red-light)',
};

const STATUS_DOT: Record<StageStatus, string> = {
  done: 'var(--brand-green-mid)',
  active: 'var(--brand-blue-mid)',
  pending: 'var(--brand-neutral-dark)',
  blocked: 'var(--brand-red-mid)',
};

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
        } as CSSProperties
      }
      className={cn(
        'flex items-center gap-3 rounded-lg px-4 py-3',
        'bg-[var(--stage-bg)]',
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
        className="min-w-0 flex-1 truncate text-sm font-medium text-stone-800 dark:text-stone-200"
        data-component-part="stage-label"
      >
        {label}
      </span>
      {meta ? (
        <span
          className="shrink-0 text-xs text-stone-500 dark:text-stone-400"
          data-component-part="stage-meta"
        >
          {meta}
        </span>
      ) : null}
    </div>
  );
}
