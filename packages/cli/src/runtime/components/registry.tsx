// MDX component map for React-rendered blocks. Tenants reference these
// without imports — Astro's MDX integration receives this map (merged with
// the Astro components from the page route) via `<Content components={...}>`.
//
// Components that need to introspect their children's props (Tabs, Steps,
// Accordion, Columns) live as .astro files alongside this one and are merged
// in at the page level. The Astro+React+MDX boundary pre-renders nested
// React children to strings before they reach the parent React component, so
// `Children.toArray(...).filter(isValidElement)` in those parents always sees
// an empty array. Astro components dodge this by using slots.
import type { ComponentType, ReactNode } from 'react';
import {
  Accordion,
  AccordionGroup,
  Badge,
  Callout,
  Card,
  CardGroup,
  CodeBlock,
  Columns,
  Expandable,
  FeatureCard,
  FeatureCardGroup,
  Frame,
  Hero,
  Icon,
  MediaCard,
  Mermaid,
  ParamField,
  Profile,
  Property,
  RequestExample,
  ResponseExample,
  ResponseField,
  Sheet,
  Stage,
  StageList,
  Stat,
  Stats,
  Tooltip,
  TopicCard,
  TopicLink,
  Tree,
  Update,
  Video,
  VideoLoop,
  // Aliases:
  Info,
  Note,
  Tip,
  Check,
  Warning,
  Danger,
} from '@nebula-docs/components';

interface CalloutShimProps {
  type?: string;
  variant?: string;
  title?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

const CalloutShim = ({ type, variant, ...rest }: CalloutShimProps) => (
  <Callout variant={(variant ?? type) as never} {...rest} />
);

interface ImageShimProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src?: string;
  /** Mintlify-shaped opt-out from click-to-zoom. */
  noZoom?: boolean;
}

/**
 * Override for the bare `<img>` element used in MDX (both JSX `<img>` and
 * markdown `![]()`). Tags every image with `data-zoomable` unless the author
 * sets `noZoom`, so the global Lightbox script in the layout can attach a
 * click-to-zoom handler. Pure-static — no React hydration cost per image.
 */
const ImageShim = ({ noZoom, ...rest }: ImageShimProps) => {
  const dataZoomable = noZoom ? undefined : '';
  return <img {...rest} data-zoomable={dataZoomable} />;
};

export const components: Record<string, ComponentType<any>> = {
  Accordion,
  AccordionGroup,
  Badge,
  Callout: CalloutShim,
  Card,
  CardGroup,
  CodeBlock,
  Columns,
  Expandable,
  FeatureCard,
  FeatureCardGroup,
  Frame,
  Hero,
  Icon,
  MediaCard,
  Mermaid,
  ParamField,
  Profile,
  Property,
  RequestExample,
  ResponseExample,
  ResponseField,
  Sheet,
  Stage,
  StageList,
  Stat,
  Stats,
  Tooltip,
  TopicCard,
  TopicLink,
  Tree,
  Update,
  Video,
  VideoLoop,
  Info,
  Note,
  Tip,
  Check,
  Warning,
  Danger,
  // HTML overrides — lowercase keys swap the tag's default rendering for
  // both `<img>` JSX in MDX and markdown `![]()` syntax.
  img: ImageShim,
};
