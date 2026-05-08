import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface StageListProps {
  children?: ReactNode;
  className?: string;
}

export function StageList({ children, className }: StageListProps) {
  return (
    <div
      className={cn('my-5 flex flex-col gap-[13px]', className)}
      data-component-part="stage-list"
    >
      {children}
    </div>
  );
}
