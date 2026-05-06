// MDX component map. Tenants reference these without imports — Astro's MDX
// integration receives this map via `<Content components={...} />`.
//
// SSR limitation: Astro's MDX + React pipeline pre-renders nested React
// components to strings before they reach the parent component, so a parent
// like Tabs that does `Children.toArray(children).filter(isValidElement)` to
// read each child's props sees an empty array — even when there are children
// in the source MDX. The introspection pattern would need a hydration boundary
// (an Astro wrapper with `client:load`) to work; that lands in Phase 3 along
// with the search island and theme-switcher island.
//
// For now, the affected components (Tabs, Tab, Steps, Step) get static-only
// shims that bypass introspection: every panel shows, step numbers are
// rendered as `n.` markers from each Step's own props rather than injected by
// Steps. The visual is non-interactive but every block from the synthetic
// tenant renders without errors.
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

interface TabsShimProps {
  children?: ReactNode;
  className?: string;
}

const TabsShim = ({ children, className }: TabsShimProps) => (
  <div
    className={className}
    style={{
      margin: 'var(--mcoe-space-4) 0',
      border: '1px solid var(--mcoe-border-muted)',
      borderRadius: 'var(--mcoe-radius)',
      overflow: 'hidden',
    }}
    data-component-part="tabs"
  >
    {children}
  </div>
);

interface TabShimProps {
  title?: string;
  children?: ReactNode;
}

const TabShim = ({ title, children }: TabShimProps) => (
  <section
    data-component-part="tab"
    style={{
      borderTop: '1px solid var(--mcoe-border-muted)',
      padding: 'var(--mcoe-space-4)',
    }}
  >
    {title && (
      <header
        style={{
          fontSize: 'var(--mcoe-font-size-sm)',
          fontWeight: 'var(--mcoe-font-weight-bold)',
          color: 'var(--mcoe-text-heading)',
          marginBottom: 'var(--mcoe-space-3)',
        }}
      >
        {title}
      </header>
    )}
    <div>{children}</div>
  </section>
);

interface StepsShimProps {
  children?: ReactNode;
  className?: string;
}

const StepsShim = ({ children, className }: StepsShimProps) => (
  <ol
    className={className}
    style={{
      margin: 'var(--mcoe-space-5) 0',
      padding: 0,
      listStyle: 'none',
      counterReset: 'nebula-step',
    }}
    data-component-part="steps"
  >
    {children}
  </ol>
);

interface StepShimProps {
  title?: string;
  children?: ReactNode;
}

const StepShim = ({ title, children }: StepShimProps) => (
  <li
    data-component-part="step-item"
    style={{
      counterIncrement: 'nebula-step',
      paddingLeft: 'var(--mcoe-space-7)',
      paddingBottom: 'var(--mcoe-space-5)',
      position: 'relative',
    }}
  >
    <span
      aria-hidden
      style={{
        position: 'absolute',
        left: 0,
        top: '0.1em',
        width: '1.6em',
        height: '1.6em',
        borderRadius: '50%',
        background: 'var(--mcoe-bg-tertiary)',
        border: '1px solid var(--mcoe-border-default)',
        color: 'var(--mcoe-text-heading)',
        fontWeight: 'var(--mcoe-font-weight-bold)',
        fontSize: '0.75em',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span style={{ display: 'inline-block' }}>•</span>
    </span>
    {title && (
      <h4
        style={{
          margin: '0 0 var(--mcoe-space-2)',
          fontSize: 'var(--mcoe-font-size-md)',
          fontWeight: 'var(--mcoe-font-weight-bold)',
          color: 'var(--mcoe-text-heading)',
        }}
      >
        {title}
      </h4>
    )}
    <div>{children}</div>
  </li>
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
  Step: StepShim,
  Steps: StepsShim,
  Tab: TabShim,
  Tabs: TabsShim,
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
