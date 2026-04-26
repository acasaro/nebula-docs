/**
 * Compat re-export. Canonical implementation lives in `@nebula/components`.
 * `IconProps` here aliases the natural-API prop type (with children passthrough),
 * not the zod-schema-inferred props type.
 */
export { Icon } from '@nebula/components';
export type { IconNaturalProps as IconProps, IconLibrary } from '@nebula/components';
