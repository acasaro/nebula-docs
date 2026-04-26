import type { ReactNode } from 'react';
import {
  CircleAlert,
  CircleCheck,
  Info,
  Lightbulb,
  OctagonAlert,
  TriangleAlert,
} from 'lucide-react';
import { Icon as McoeIcon } from '../icon';
import { cn } from '../utils/cn';

export type CalloutVariant =
  | 'info'
  | 'warning'
  | 'note'
  | 'tip'
  | 'check'
  | 'danger'
  | 'custom';

export interface CalloutProps {
  children?: ReactNode;
  title?: string;
  variant?: CalloutVariant;
  icon?: ReactNode;
  className?: string;
  ariaLabel?: string;
}

const variantConfig: Record<
  Exclude<CalloutVariant, 'custom'>,
  {
    Icon: typeof Info;
    label: string;
    container: string;
    body: string;
  }
> = {
  info: {
    Icon: Info,
    label: 'Info',
    container:
      'border border-stone-200 bg-stone-50 dark:border-stone-700 dark:bg-white/10',
    body: 'text-stone-800 dark:text-stone-300',
  },
  note: {
    Icon: CircleAlert,
    label: 'Note',
    container:
      'border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-600/20',
    body: 'text-blue-800 dark:text-blue-300',
  },
  tip: {
    Icon: Lightbulb,
    label: 'Tip',
    container:
      'border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-600/20',
    body: 'text-green-800 dark:text-green-300',
  },
  check: {
    Icon: CircleCheck,
    label: 'Check',
    container:
      'border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-600/20',
    body: 'text-green-800 dark:text-green-300',
  },
  warning: {
    Icon: TriangleAlert,
    label: 'Warning',
    container:
      'border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-600/20',
    body: 'text-yellow-800 dark:text-yellow-300',
  },
  danger: {
    Icon: OctagonAlert,
    label: 'Danger',
    container:
      'border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-600/20',
    body: 'text-red-800 dark:text-red-300',
  },
};

const customClasses = {
  container:
    'border border-stone-500/20 bg-stone-50/50 dark:border-stone-500/30 dark:bg-stone-500/10',
  body: 'text-stone-900 dark:text-stone-200',
};

export function Callout({
  children,
  title,
  variant = 'custom',
  icon,
  className,
  ariaLabel,
}: CalloutProps) {
  const isPreset = variant !== 'custom';
  const config = isPreset ? variantConfig[variant] : null;

  const resolvedIcon =
    typeof icon === 'string' ? <McoeIcon icon={icon} size={16} /> : icon;
  const renderedIcon =
    resolvedIcon ??
    (config ? (
      <config.Icon size={16} aria-label={ariaLabel ?? config.label} />
    ) : null);
  const containerClasses = config?.container ?? customClasses.container;
  const bodyClasses = config?.body ?? customClasses.body;

  return (
    <div
      className={cn(
        'my-4 flex items-center gap-3 overflow-hidden rounded-2xl px-5 py-4',
        containerClasses,
        className,
      )}
      data-callout-type={variant}
    >
      {renderedIcon ? (
        <div
          className={cn('size-4 shrink-0', bodyClasses)}
          data-component-part="callout-icon"
        >
          {renderedIcon}
        </div>
      ) : null}
      <div
        className={cn(
          'prose dark:prose-invert w-full min-w-0 text-sm leading-6 [&_a]:border-current [&_a]:text-current! [&_code]:text-current! [&_strong]:text-current! [&_p]:my-0',
          title && '[&>:nth-child(2)]:mt-2',
          bodyClasses,
        )}
        data-component-part="callout-content"
      >
        {title ? (
          <div className="font-semibold" data-component-part="callout-title">
            {title}
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}

type PresetProps = Omit<CalloutProps, 'variant'>;
const preset =
  (variant: Exclude<CalloutVariant, 'custom'>) =>
  (props: PresetProps) => <Callout {...props} variant={variant} />;

export const Info_ = preset('info');
export const Note = preset('note');
export const Tip = preset('tip');
export const Check = preset('check');
export const Warning = preset('warning');
export const Danger = preset('danger');

// Preserve the documented `Info` export name. (Local var renamed to avoid
// colliding with lucide-react's `Info` icon import above.)
export { Info_ as Info };
