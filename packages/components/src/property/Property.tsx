import { useMemo, type ReactNode } from 'react';
import { cn } from '../utils/cn';

const MAX_DEFAULT_VALUE_LENGTH = 250;

export interface PropertyProps {
  name: string;
  type?: string;
  location?: string;
  hidden?: boolean;
  default?: unknown;
  required?: boolean;
  deprecated?: boolean;
  pre?: string[];
  post?: string[];
  className?: string;
  children?: ReactNode;
  /** Optional text labels (i18n hooks). */
  defaultLabel?: string;
  requiredLabel?: string;
  deprecatedLabel?: string;
}

const DEFAULT_DEFAULT_LABEL = 'default';
const DEFAULT_REQUIRED_LABEL = 'required';
const DEFAULT_DEPRECATED_LABEL = 'deprecated';

/**
 * Mintlify-style Property — the primitive behind ParamField and ResponseField
 * in API docs. Renders a header row with name + type/required/deprecated/default
 * pills, then a body with the description.
 *
 * Vendor's anchor-copy + slugified id + scroll-spy is dropped for Phase 3 —
 * we'll wire those up alongside the editor's anchor model.
 */
export function Property({
  name,
  type,
  location,
  hidden,
  default: defaultValue,
  required,
  deprecated,
  pre,
  post,
  className,
  children,
  defaultLabel = DEFAULT_DEFAULT_LABEL,
  requiredLabel = DEFAULT_REQUIRED_LABEL,
  deprecatedLabel = DEFAULT_DEPRECATED_LABEL,
}: PropertyProps) {
  const stringifiedDefault = useMemo(() => {
    if (defaultValue == null) return null;
    if (typeof defaultValue === 'object') {
      const containsNestedObject = Object.values(
        defaultValue as Record<string, unknown>,
      ).some((v) => v !== null && typeof v === 'object');
      if (containsNestedObject) return null;
    }
    try {
      const stringified = JSON.stringify(defaultValue);
      if (stringified && stringified.length < MAX_DEFAULT_VALUE_LENGTH) {
        return stringified;
      }
    } catch {
      return null;
    }
    return null;
  }, [defaultValue]);

  if (hidden) return null;

  // Defensive: when MDX passes `pre={['Required']}` the editor's mdast attr
  // extractor falls through to `{ __expression: "[...]" }` if JSON.parse
  // can't handle the JS literal (single quotes, trailing commas, etc.).
  // `.map()` on that object would throw — fall back to an empty list.
  const preList = Array.isArray(pre) ? pre : [];
  const postList = Array.isArray(post) ? post : [];

  return (
    <div
      className={cn(
        'my-2.5 border-b border-stone-200/70 pb-5 pt-2.5 dark:border-stone-800/70',
        className,
      )}
      data-component-part="field"
    >
      <div className="flex flex-wrap items-center gap-2 break-all font-mono text-sm">
        {preList.map((item, i) => (
          <Pill key={`pre-${i}`}>{item}</Pill>
        ))}
        <span
          className="overflow-wrap-anywhere font-semibold text-primary"
          data-component-part="field-name"
        >
          {name}
        </span>
        {type ? <Pill>{type}</Pill> : null}
        {location ? <Pill>{location}</Pill> : null}
        {stringifiedDefault !== null ? (
          <Pill prefix={defaultLabel}>
            {typeof defaultValue === 'string' && defaultValue === ''
              ? '""'
              : stringifiedDefault}
          </Pill>
        ) : null}
        {required ? <RequiredPill label={requiredLabel} /> : null}
        {deprecated ? <DeprecatedPill label={deprecatedLabel} /> : null}
        {postList.map((item, i) => (
          <Pill key={`post-${i}`}>{item}</Pill>
        ))}
      </div>
      {children ? (
        <div
          className="prose prose-sm prose-stone dark:prose-invert mt-3"
          data-component-part="field-content"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

interface PillProps {
  children?: ReactNode;
  prefix?: string;
  className?: string;
}

function Pill({ children, prefix, className }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 break-all rounded-md bg-stone-100/60 px-2 py-0.5 font-medium text-stone-600 dark:bg-white/5 dark:text-stone-200',
        className,
      )}
      data-component-part="field-pill"
    >
      {prefix ? <span className="text-stone-400 dark:text-stone-500">{prefix}</span> : null}
      <span>{children}</span>
    </span>
  );
}

function RequiredPill({ label = DEFAULT_REQUIRED_LABEL }: { label?: string }) {
  return (
    <span
      className="whitespace-nowrap rounded-md bg-red-100/50 px-2 py-0.5 font-medium text-red-600 dark:bg-red-400/10 dark:text-red-300"
      data-component-part="field-required-pill"
    >
      {label}
    </span>
  );
}

function DeprecatedPill({ label = DEFAULT_DEPRECATED_LABEL }: { label?: string }) {
  return (
    <span
      className="whitespace-nowrap rounded-md bg-amber-100/50 px-2 py-0.5 font-medium text-amber-600 dark:bg-amber-400/10 dark:text-amber-300"
      data-component-part="field-deprecated-pill"
    >
      {label}
    </span>
  );
}

/**
 * Mintlify aliases — `<ParamField>` and `<ResponseField>` in MDX both resolve
 * to the same Property primitive. Mintlify uses any of `path` / `query` /
 * `header` / `body` / `cookie` for ParamField (the attribute name doubles
 * as the parameter location), `name` for ResponseField; we accept all and
 * surface the location as a pill so the rendered field reads
 * "id [string] [query]" without needing a separate `location=` prop.
 */
type FieldProps = Omit<PropertyProps, 'name'> & {
  name?: string;
  path?: string;
  query?: string;
  header?: string;
  body?: string;
  cookie?: string;
};

const PARAM_LOCATIONS: Array<keyof FieldProps> = [
  'path',
  'query',
  'header',
  'body',
  'cookie',
];

export function ParamField({
  name,
  location,
  ...rest
}: FieldProps) {
  let resolvedName = name;
  let resolvedLocation = location;
  for (const key of PARAM_LOCATIONS) {
    const v = rest[key];
    if (typeof v === 'string' && !resolvedName) {
      resolvedName = v;
      resolvedLocation = resolvedLocation ?? key;
    }
    delete rest[key];
  }
  return (
    <Property
      name={resolvedName ?? ''}
      location={resolvedLocation}
      {...rest}
    />
  );
}

export function ResponseField({ name, path, ...rest }: FieldProps) {
  return <Property name={name ?? path ?? ''} {...rest} />;
}
