import * as React from 'react';
import { cn } from '@/lib/utils';

interface ProgressProps extends React.ComponentProps<'div'> {
  value?: number;
}

export function Progress({ className, value = 0, ...props }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role='progressbar'
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped}
      data-slot='progress'
      className={cn(
        'relative h-1.5 w-full overflow-hidden rounded-full bg-muted',
        className,
      )}
      {...props}>
      <div
        data-slot='progress-indicator'
        className='h-full bg-primary transition-[width] duration-150 ease-out'
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
