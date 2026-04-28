/**
 * Compat re-export. Canonical implementation lives in `@nebula-docs/components`.
 * `IconProps` here aliases the natural-API prop type (with children passthrough),
 * not the zod-schema-inferred props type.
 */
export { Icon } from '@nebula-docs/components';
export type { IconNaturalProps as IconProps, IconLibrary } from '@nebula-docs/components';
