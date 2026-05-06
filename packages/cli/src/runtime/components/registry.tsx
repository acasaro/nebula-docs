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
  Frame,
  Icon,
  Mermaid,
  ParamField,
  Property,
  RequestExample,
  ResponseExample,
  ResponseField,
  Tree,
  Update,
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
  Frame,
  Icon,
  Mermaid,
  ParamField,
  Property,
  RequestExample,
  ResponseExample,
  ResponseField,
  Tree,
  Update,
  VideoLoop,
  Info,
  Note,
  Tip,
  Check,
  Warning,
  Danger,
};
