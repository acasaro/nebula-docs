import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

export type StepTitleSize = 'p' | 'h2' | 'h3' | 'h4';

export interface StepProps {
  title?: ReactNode;
  titleSize?: StepTitleSize;
  icon?: ReactNode;
  /** Filled in by `<Steps>` when used as a child. Defaults to 1 standalone. */
  stepNumber?: number;
  /** Filled in by `<Steps>` to suppress the trailing connector line. */
  isLast?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * Mintlify-style Step item. Standalone-friendly, but typically nested inside
 * a `<Steps>` container that injects `stepNumber` and `isLast` via cloneElement.
 */
export function Step({
  title,
  titleSize = 'p',
  icon,
  stepNumber = 1,
  isLast = false,
  className,
  children,
}: StepProps) {
  return (
    <div
      role="listitem"
      className={cn('group/step relative flex items-start pb-5', className)}
      data-component-part="step-item"
    >
      <div
        aria-hidden="true"
        className={cn(
          'absolute top-11 h-[calc(100%-2.75rem)] w-px',
          isLast
            ? 'bg-linear-to-b from-stone-200 via-80% via-stone-200 to-transparent dark:from-white/10 dark:via-white/10'
            : 'bg-stone-200/70 dark:bg-white/10',
        )}
        data-component-part="step-line"
      />
      <div
        aria-hidden="true"
        className="absolute -ml-3 py-2"
        data-component-part="step-number"
      >
        <div className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-stone-50 font-semibold text-stone-900 text-xs dark:bg-white/10 dark:text-stone-50">
          {icon ?? stepNumber}
        </div>
      </div>
      <div className="w-full overflow-hidden pr-px pl-8">
        {title ? <StepTitle as={titleSize}>{title}</StepTitle> : null}
        <div
          className={cn('prose dark:prose-invert', !title && 'mt-2')}
          data-component-part="step-content"
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function StepTitle({ as, children }: { as: StepTitleSize; children: ReactNode }) {
  const className = 'mt-2 text-stone-900 dark:text-stone-200';
  if (as === 'p') {
    return (
      <p
        className={cn(className, 'prose dark:prose-invert font-semibold')}
        data-component-part="step-title"
      >
        {children}
      </p>
    );
  }
  if (as === 'h2') {
    return (
      <h2 className={className} data-component-part="step-title">
        {children}
      </h2>
    );
  }
  if (as === 'h3') {
    return (
      <h3 className={className} data-component-part="step-title">
        {children}
      </h3>
    );
  }
  return (
    <h4 className={className} data-component-part="step-title">
      {children}
    </h4>
  );
}
