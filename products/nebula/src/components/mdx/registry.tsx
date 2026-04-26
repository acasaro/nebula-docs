import type { ComponentType, ReactNode } from 'react';

export interface MdxComponentProps {
  attributes: Record<string, unknown>;
  children?: ReactNode;
}

export type MdxComponent = ComponentType<MdxComponentProps>;

/**
 * Components are registered by JSX tag name. Phase 3 ports Mintlify's set
 * one-by-one from `vendor/mintlify-components/`. Until a component is
 * registered, JSX nodes render via the fallback placeholder.
 *
 * Inline (`<Icon />` next to text) and block (`<Frame>...</Frame>`) blocks
 * share the same registry — the renderer chooses inline vs block based on
 * the MDAST node type (`mdxJsxTextElement` vs `mdxJsxFlowElement`).
 */
export const componentRegistry: Record<string, MdxComponent> = {};

export function registerComponent(name: string, Component: MdxComponent): void {
  componentRegistry[name] = Component;
}

export function lookupComponent(name: string): MdxComponent | undefined {
  return componentRegistry[name];
}
