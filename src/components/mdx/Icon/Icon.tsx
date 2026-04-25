import type { CSSProperties, ReactNode } from 'react';
import { resolveColor } from '@site/src/lib/tokens';

type IconLibrary = 'material-symbol' | 'material';

interface IconProps {
  /** Icon name from the library, a URL, or inline SVG as children */
  icon?: string;
  color?: string;
  size?: number;
  iconLibrary?: IconLibrary;
  className?: string;
  children?: ReactNode;
}

function getIconUrl(icon: string, library: IconLibrary): string | null {
  // URL or path — pass through
  if (icon.startsWith('http') || icon.startsWith('/')) return icon;

  switch (library) {
    case 'material-symbol':
      // Google Material Symbols (variable font, outlined by default)
      // https://fonts.google.com/icons?icon.set=Material+Symbols
      return `https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/${icon}/default/48px.svg`;
    case 'material':
      // Google Material Icons (classic)
      // https://fonts.google.com/icons?icon.set=Material+Icons
      return `https://fonts.gstatic.com/s/i/materialicons/${icon}/v1/24px.svg`;
    default:
      return null;
  }
}

export function Icon({
  icon,
  color,
  size = 16,
  iconLibrary = 'material-symbol',
  className,
  children,
}: IconProps) {
  const resolvedColor = color ? resolveColor(color) : 'currentColor';

  // Inline SVG passed as children
  if (children) {
    return (
      <span
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: size,
          height: size,
          color: resolvedColor,
        }}
      >
        {children}
      </span>
    );
  }

  if (!icon) return null;

  const url = getIconUrl(icon, iconLibrary);
  if (!url) return null;

  const maskStyle: CSSProperties = {
    display: 'inline-block',
    verticalAlign: 'middle',
    width: size,
    height: size,
    backgroundColor: resolvedColor,
    WebkitMaskImage: `url(${url})`,
    WebkitMaskRepeat: 'no-repeat',
    WebkitMaskPosition: 'center',
    WebkitMaskSize: 'contain',
    maskImage: `url(${url})`,
    maskRepeat: 'no-repeat',
    maskPosition: 'center',
    maskSize: 'contain',
  };

  return <span className={className} style={maskStyle} />;
}

export type { IconProps, IconLibrary };
