import type { HeadingBlock } from '@nebula/schemas';

export interface HeadingProps {
  block: HeadingBlock;
}

export function Heading({ block }: HeadingProps) {
  const { level, text, anchor } = block.props;
  switch (level) {
    case 1:
      return <h1 id={anchor}>{text}</h1>;
    case 2:
      return <h2 id={anchor}>{text}</h2>;
    case 3:
      return <h3 id={anchor}>{text}</h3>;
    case 4:
      return <h4 id={anchor}>{text}</h4>;
    case 5:
      return <h5 id={anchor}>{text}</h5>;
    case 6:
      return <h6 id={anchor}>{text}</h6>;
  }
}
