import type { ComponentType } from 'react';
import {
  Badge,
  Callout,
  Check,
  Danger,
  Frame,
  Info,
  Note,
  Tip,
  Warning,
} from '@nebula/components';

/**
 * Components are registered by JSX tag name. Phase 3 ports Mintlify's set
 * one-by-one from `vendor/mintlify-components/`. Until a component is
 * registered, JSX nodes render via the fallback placeholder.
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
  Callout: Callout as unknown as MdxComponent,
  Note: Note as unknown as MdxComponent,
  Tip: Tip as unknown as MdxComponent,
  Info: Info as unknown as MdxComponent,
  Check: Check as unknown as MdxComponent,
  Warning: Warning as unknown as MdxComponent,
  Danger: Danger as unknown as MdxComponent,
};

export function registerComponent(name: string, Component: MdxComponent): void {
  componentRegistry[name] = Component;
}

export function lookupComponent(name: string): MdxComponent | undefined {
  return componentRegistry[name];
}
