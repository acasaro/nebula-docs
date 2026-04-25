import emotionStyled from '@emotion/styled';
import type { CSSObject } from '@emotion/react';
import type { ComponentType, CSSProperties, JSX, ReactNode } from 'react';

type ComponentInput = keyof JSX.IntrinsicElements | ComponentType<never>;

/**
 * Open prop contract for styled outputs. Deriving `ComponentProps<C>` breaks
 * under `strictFunctionTypes` contravariance when the wrapped component has
 * required props (e.g. Docusaurus `Link`'s `to`). An open index signature
 * lets consumers pass `to`, `href`, `data-*`, etc. without losing the core
 * typing of `children`, `className`, and `style`.
 */
type StyledProps = {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  [key: string]: unknown;
};

/**
 * Thin wrapper around @emotion/styled that supports Abyss-style object syntax:
 *
 *   const Box = styled('div', { padding: '16px', borderRadius: '8px' });
 *   const StyledLink = styled(Link, { marginLeft: '5px' });
 */
export function styled<C extends ComponentInput>(
  component: C,
  styles: CSSObject,
): (props: StyledProps) => JSX.Element {
  return emotionStyled(component as never)(styles) as unknown as (
    props: StyledProps,
  ) => JSX.Element;
}
