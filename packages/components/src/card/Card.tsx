import type { ElementType, ReactNode } from 'react';
import { ArrowRight, ArrowUpRight } from 'lucide-react';
import { Icon } from '../icon';
import { cn } from '../utils/cn';

export type CardAlign = 'start' | 'center';
export type CardPadding = 'sm' | 'normal' | 'lg' | 'xl';

export interface CardProps {
  title?: ReactNode;
  icon?: ReactNode;
  img?: string;
  horizontal?: boolean;
  href?: string;
  cta?: string;
  arrow?: boolean;
  disabled?: boolean;
  /** Content alignment inside the card. `start` (default) is the
   *  Mintlify-style left-align; `center` centers all children for the
   *  mission-statement / pull-quote layout (badge centered above
   *  centered text). */
  align?: CardAlign;
  /** Inner padding scale. `normal` (default) is `px-6 py-5`; `lg` and
   *  `xl` give roomier breathing room for hero/mission-statement
   *  compositions; `sm` is a tighter density for sidebar callouts or
   *  index tiles. */
  padding?: CardPadding;
  className?: string;
  children?: ReactNode;
}

const PADDING_CLASSES: Record<CardPadding, string> = {
  sm: 'px-4 py-3',
  normal: 'px-6 py-5',
  lg: 'px-8 py-7',
  xl: 'px-10 py-10',
};

function isExternalUrl(url: string): boolean {
  return /^[a-z]+:\/\//i.test(url) || url.startsWith('//');
}

/**
 * Mintlify-style Card. Optional title, icon, image, link, and CTA.
 * `horizontal` lays icon + body side-by-side; default is stacked.
 */
export function Card({
  title,
  icon,
  img,
  horizontal,
  href,
  cta,
  arrow,
  disabled,
  align = 'start',
  padding = 'normal',
  className,
  children,
}: CardProps) {
  const isCentered = align === 'center';
  const resolvedHref = disabled ? undefined : href;
  const isLink = !!resolvedHref;
  const Component: ElementType = isLink ? 'a' : 'div';
  const external = isLink && isExternalUrl(resolvedHref!);
  const showArrow = arrow ?? external;

  const imageAlt = img
    ? (img.match(/\/([^/]+)\.[^.]+$/)?.[1] ?? '')
    : '';

  return (
    <Component
      className={cn(
        'group relative my-2 block w-full overflow-hidden rounded-2xl border border-stone-950/10 bg-white font-normal ring-2 ring-transparent dark:border-white/10 dark:bg-stone-900/40',
        // When the Card is a link, the wrapper is an `<a>` and would
        // otherwise inherit the prose link color + hover underline from
        // `.mdx-prose a` rules. The Card's own affordance is the border
        // highlight + arrow; suppress text-decoration + force the local
        // text color so the body type doesn't read as a hyperlink.
        isLink && 'text-inherit no-underline hover:no-underline focus:no-underline',
        isLink &&
          'cursor-pointer hover:border-stone-950/30 dark:hover:border-white/30',
        isLink &&
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
        disabled && 'opacity-60',
        className,
      )}
      href={resolvedHref}
      target={external ? '_blank' : undefined}
      rel={external ? 'noreferrer' : undefined}
    >
      {img ? (
        <img
          alt={imageAlt}
          className="not-prose w-full object-cover object-center"
          data-component-part="card-image"
          src={img}
        />
      ) : null}
      <div
        className={cn(
          'relative',
          PADDING_CLASSES[padding] ?? PADDING_CLASSES.normal,
          horizontal && 'flex items-center gap-x-4',
          isCentered && 'flex flex-col items-center text-center',
        )}
        data-component-part="card-content-container"
      >
        {isLink && showArrow ? (
          <div
            aria-hidden="true"
            className="absolute right-5 top-5 text-stone-400 group-hover:text-stone-700 dark:text-stone-500 dark:group-hover:text-stone-200"
            data-component-part="card-arrow"
          >
            <ArrowUpRight className="size-4" />
          </div>
        ) : null}
        {icon ? (
          <div
            className="size-6 fill-stone-800 text-stone-800 dark:fill-stone-100 dark:text-stone-100"
            data-component-part="card-icon"
          >
            {typeof icon === 'string' ? <Icon icon={icon} size={24} /> : icon}
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          {title ? (
            <h3
              className={cn(
                'not-prose wrap-break-word font-semibold text-base text-stone-800 dark:text-white',
                icon && !horizontal && 'mt-4',
              )}
              data-component-part="card-title"
            >
              {title}
            </h3>
          ) : null}
          <div
            className={cn(
              'prose wrap-break-word mt-1 font-normal text-base leading-6',
              title
                ? 'text-stone-600 dark:text-stone-400'
                : 'text-stone-700 dark:text-stone-300',
              horizontal && 'mt-0 leading-6',
            )}
            data-component-part="card-content"
          >
            {children}
          </div>
          {cta ? (
            <div className="mt-4" data-component-part="card-cta">
              <span
                className={cn(
                  'flex flex-row items-center gap-2 text-left font-medium text-sm text-stone-600 dark:text-stone-400',
                  !disabled &&
                    'group-hover:text-stone-900 dark:group-hover:text-stone-200',
                )}
              >
                {cta}
                <ArrowRight className="size-4" />
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </Component>
  );
}
