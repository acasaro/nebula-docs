import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../utils/cn';

/**
 * Icon resolves names + library + type to a CDN URL and renders the SVG
 * via `mask-image` so authors can recolor with `currentColor` (or an
 * explicit `color` prop). Custom SVG URLs also use `mask-image` so they
 * inherit the parent's CSS color; non-SVG custom URLs (PNG, JPG, etc.)
 * render as `<img>` and keep their original colors.
 *
 * The CDN is hosted from `mcoe-icons.web.app`, deployed via
 * `pnpm -w run icons:deploy`. Source corpora: Lucide, Material Icons,
 * Material Symbols. UHG / Optum sets get added later.
 */
const ICON_CDN_BASE = 'https://mcoe-icons.web.app/icons';

export const ICON_LIBRARIES = ['lucide', 'material', 'material-symbols'] as const;
export type IconLibrary = (typeof ICON_LIBRARIES)[number];

export const MATERIAL_ICON_TYPES = [
  'filled',
  'outlined',
  'rounded',
  'sharp',
  'two-tone',
] as const;
export const MATERIAL_SYMBOLS_ICON_TYPES = [
  'outlined',
  'rounded',
  'sharp',
] as const;
export type MaterialIconType = (typeof MATERIAL_ICON_TYPES)[number];
export type MaterialSymbolsIconType = (typeof MATERIAL_SYMBOLS_ICON_TYPES)[number];
export type IconType = MaterialIconType | MaterialSymbolsIconType;

export interface IconProps {
  /** Kebab-case name. Absolute URLs and path-rooted paths render as-is. */
  icon?: string;
  iconLibrary?: IconLibrary;
  /** Variant within the library. Lucide ignores; Material/MS use it. */
  iconType?: IconType;
  size?: number;
  /** CSS color applied via the mask (defaults to `currentColor`). Ignored
   * for custom URLs, which keep their original colors. */
  color?: string;
  className?: string;
  /** Inline SVG passed as children — rendered as-is, bypasses the CDN. */
  children?: ReactNode;
}

/** Kept for back-compat; old shape used `IconNaturalProps` as the type name. */
export type IconNaturalProps = IconProps;

function isCustomUrl(icon: string): boolean {
  return /^https?:\/\//i.test(icon) || icon.startsWith('/');
}

/**
 * Build the CDN URL for a (library, type, name) tuple. Returns the input
 * unchanged when it's already an absolute or path-rooted URL.
 */
export function buildIconUrl(
  icon: string,
  library: IconLibrary = 'lucide',
  type?: IconType,
): string {
  if (isCustomUrl(icon)) return icon;
  const segments: string[] = [ICON_CDN_BASE, library];
  if (type && library !== 'lucide') segments.push(type);
  segments.push(`${icon}.svg`);
  return segments.join('/');
}

export function Icon({
  icon,
  iconLibrary = 'lucide',
  iconType,
  size = 16,
  color,
  className,
  children,
}: IconProps) {
  if (children) {
    return (
      <span
        className={cn('inline-flex items-center justify-center', className)}
        style={{ width: size, height: size, color }}
      >
        {children}
      </span>
    );
  }

  if (!icon) return null;

  if (isCustomUrl(icon)) {
    const pathname = icon.split('?')[0] ?? '';
    if (!pathname.toLowerCase().endsWith('.svg')) {
      return (
        <img
          src={icon}
          alt=""
          className={cn('inline-block', className)}
          style={{ width: size, height: size }}
          aria-hidden="true"
        />
      );
    }
  }

  const url = isCustomUrl(icon) ? icon : buildIconUrl(icon, iconLibrary, iconType);
  const style: CSSProperties = {
    display: 'inline-block',
    width: size,
    height: size,
    WebkitMaskImage: `url(${url})`,
    maskImage: `url(${url})`,
    WebkitMaskRepeat: 'no-repeat',
    maskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    maskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskSize: 'contain',
    backgroundColor: color ?? 'currentColor',
  };

  return (
    <span
      className={cn('inline-block align-[-0.125em]', className)}
      style={style}
      aria-hidden="true"
    />
  );
}

