import type { CSSProperties } from 'react';
import { cn } from '../utils/cn';

export interface ProfileProps {
  /** Display name. Required — also drives the fallback initials when no
   *  photo is provided. */
  name: string;
  /** Optional secondary line beneath the name (role, title, team, etc). */
  title?: string;
  /** URL of a square headshot. Renders as a circular crop. */
  photo?: string;
  /** Optional href — turns the whole card into a link. */
  href?: string;
  /** Override the initials shown when `photo` is empty. */
  initials?: string;
  /** Background color for the initials circle. Accepts any CSS color. */
  accent?: string;
  className?: string;
  style?: CSSProperties;
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]!;
  if (parts.length === 1) return first.slice(0, 2).toUpperCase();
  const last = parts[parts.length - 1]!;
  return ((first[0] ?? '') + (last[0] ?? '')).toUpperCase();
}

/**
 * Compact profile tile — circular photo (or initials fallback), name, and
 * an optional title beneath. Designed to compose inside `<Columns>` or
 * `<CardGroup>` for team grids.
 */
export function Profile({
  name,
  title,
  photo,
  href,
  initials,
  accent,
  className,
  style,
}: ProfileProps) {
  const fallbackInitials = initials ?? deriveInitials(name);
  const Wrapper: React.ElementType = href ? 'a' : 'div';
  const wrapperProps = href ? { href, target: undefined } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        'not-prose flex flex-col items-center gap-2.5 text-center',
        href && 'no-underline transition-transform hover:-translate-y-0.5',
        className,
      )}
      style={style}
      data-component-part="profile"
    >
      <span
        className={cn(
          'block size-24 overflow-hidden rounded-full',
          'border-[3px] border-white shadow-md',
          'dark:border-stone-900',
        )}
        data-component-part="profile-photo"
      >
        {photo ? (
          <img
            src={photo}
            alt={name}
            className="block size-full object-cover"
            draggable={false}
          />
        ) : (
          <span
            className="flex size-full items-center justify-center text-lg font-semibold text-white"
            style={{ background: accent ?? 'var(--mcoe-brand-primary, #4f46e5)' }}
            aria-hidden="true"
          >
            {fallbackInitials}
          </span>
        )}
      </span>
      <span
        className="text-sm font-semibold leading-tight text-stone-900 dark:text-stone-100"
        data-component-part="profile-name"
      >
        {name}
      </span>
      {title ? (
        <span
          className="text-xs leading-snug text-stone-500 dark:text-stone-400"
          data-component-part="profile-title"
        >
          {title}
        </span>
      ) : null}
    </Wrapper>
  );
}
