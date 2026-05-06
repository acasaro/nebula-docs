import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../utils/cn';

export interface HeroProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  /** Background CSS — color, gradient, or `url(...)` image. */
  background?: string;
  /** Optional CSS color for text. */
  textColor?: string;
  /** Vertical breathing room above and below the inner container. */
  padded?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * Full-bleed hero block for `mode: custom` pages. The outer element carries
 * `data-fullbleed`, which the custom-mode layout uses to break it out to
 * viewport width. The inner `.nebula-hero-inner` re-applies the same 80rem
 * container so its content stays aligned with the regular page content
 * sitting above and below.
 */
export function Hero({
  eyebrow,
  title,
  description,
  background,
  textColor,
  padded = true,
  className,
  children,
}: HeroProps) {
  const outerStyle: CSSProperties = {};
  if (background) outerStyle.background = background;
  if (textColor) outerStyle.color = textColor;

  return (
    <section
      data-fullbleed=""
      className={cn('nebula-hero not-prose', className)}
      style={outerStyle}>
      <div className={cn('nebula-hero-inner', padded && 'nebula-hero-inner--padded')}>
        {eyebrow && <p className='nebula-hero-eyebrow'>{eyebrow}</p>}
        {title && <h1 className='nebula-hero-title'>{title}</h1>}
        {description && <p className='nebula-hero-description'>{description}</p>}
        {children && <div className='nebula-hero-children'>{children}</div>}
      </div>
    </section>
  );
}
