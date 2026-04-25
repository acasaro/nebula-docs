/**
 * Compat re-export. Canonical implementation lives in `@mcoe/blocks`.
 * `IconProps` here aliases the natural-API prop type (with children passthrough),
 * not the zod-schema-inferred props type.
 */
export { Icon } from '@mcoe/blocks';
export type { IconNaturalProps as IconProps, IconLibrary } from '@mcoe/blocks';
