import type { ComponentType } from 'react';
import {
  Accordion,
  AccordionGroup,
  Badge,
  Callout,
  Card,
  CardGroup,
  Check,
  CodeGroup,
  Column,
  Columns,
  Danger,
  Expandable,
  FeatureCard,
  FeatureCardGroup,
  Frame,
  Hero,
  Icon,
  Info,
  MediaCard,
  Mermaid,
  Note,
  Step,
  Steps,
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
  Tab,
  Tabs,
  Tip,
  TopicCard,
  TopicLink,
  Tree,
  Update,
  Video,
  VideoLoop,
  Warning,
} from '@nebula-docs/components';

/**
 * Components are registered by JSX tag name. The set ships in
 * `@nebula-docs/components`; until a component is registered here, JSX nodes
 * render via the fallback placeholder.
 *
 * Inline (`<Icon />` next to text) and block (`<Frame>...</Frame>`) blocks
 * share the same registry — the renderer chooses inline vs block based on
 * the MDAST node type (`mdxJsxTextElement` vs `mdxJsxFlowElement`).
 *
 * The renderer spreads MDX attributes onto the component as props, so each
 * component can keep its own typed prop interface without an adapter layer.
 */
export type MdxComponent = ComponentType<Record<string, unknown>>;

export const componentRegistry: Record<string, MdxComponent> = {
  Badge: Badge as unknown as MdxComponent,
  Frame: Frame as unknown as MdxComponent,
  Hero: Hero as unknown as MdxComponent,
  Callout: Callout as unknown as MdxComponent,
  Note: Note as unknown as MdxComponent,
  Tip: Tip as unknown as MdxComponent,
  Info: Info as unknown as MdxComponent,
  Check: Check as unknown as MdxComponent,
  Warning: Warning as unknown as MdxComponent,
  Danger: Danger as unknown as MdxComponent,
  Steps: Steps as unknown as MdxComponent,
  Step: Step as unknown as MdxComponent,
  Card: Card as unknown as MdxComponent,
  CardGroup: CardGroup as unknown as MdxComponent,
  CodeGroup: CodeGroup as unknown as MdxComponent,
  Columns: Columns as unknown as MdxComponent,
  Column: Column as unknown as MdxComponent,
  Tabs: Tabs as unknown as MdxComponent,
  Tab: Tab as unknown as MdxComponent,
  Accordion: Accordion as unknown as MdxComponent,
  AccordionGroup: AccordionGroup as unknown as MdxComponent,
  Expandable: Expandable as unknown as MdxComponent,
  FeatureCard: FeatureCard as unknown as MdxComponent,
  FeatureCardGroup: FeatureCardGroup as unknown as MdxComponent,
  Tree: Tree as unknown as MdxComponent,
  'Tree.Folder': Tree.Folder as unknown as MdxComponent,
  'Tree.File': Tree.File as unknown as MdxComponent,
  Update: Update as unknown as MdxComponent,
  ParamField: ParamField as unknown as MdxComponent,
  Profile: Profile as unknown as MdxComponent,
  Property: Property as unknown as MdxComponent,
  ResponseField: ResponseField as unknown as MdxComponent,
  RequestExample: RequestExample as unknown as MdxComponent,
  ResponseExample: ResponseExample as unknown as MdxComponent,
  Sheet: Sheet as unknown as MdxComponent,
  Stage: Stage as unknown as MdxComponent,
  StageList: StageList as unknown as MdxComponent,
  Stat: Stat as unknown as MdxComponent,
  Stats: Stats as unknown as MdxComponent,
  TopicCard: TopicCard as unknown as MdxComponent,
  TopicLink: TopicLink as unknown as MdxComponent,
  MediaCard: MediaCard as unknown as MdxComponent,
  Mermaid: Mermaid as unknown as MdxComponent,
  Icon: Icon as unknown as MdxComponent,
  Video: Video as unknown as MdxComponent,
  VideoLoop: VideoLoop as unknown as MdxComponent,
};

export function registerComponent(name: string, Component: MdxComponent): void {
  componentRegistry[name] = Component;
}

export function lookupComponent(name: string): MdxComponent | undefined {
  return componentRegistry[name];
}
