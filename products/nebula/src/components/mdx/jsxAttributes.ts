import type {
  MdxJsxAttribute,
  MdxJsxAttributeValueExpression,
  MdxJsxExpressionAttribute,
  MdxJsxFlowElement,
  MdxJsxTextElement,
} from 'mdast-util-mdx';

type JsxElement = MdxJsxFlowElement | MdxJsxTextElement;

/**
 * Convert MDX JSX attributes to a plain props object.
 *
 * String attributes (`title="x"`) are passed through. Boolean attributes
 * (`stroke`) become `true`. Expression attributes (`size={4}`) are
 * best-effort parsed via JSON; anything we can't parse falls through as
 * the raw expression text so block authors can still see what's there.
 *
 * Spread attributes (`{...props}`) are skipped — Phase 3 readonly doesn't
 * support them; Phase 4+ might.
 */
export function attributesToProps(node: JsxElement): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const attr of node.attributes) {
    if ((attr as MdxJsxExpressionAttribute).type === 'mdxJsxExpressionAttribute') {
      continue;
    }
    const a = attr as MdxJsxAttribute;
    if (a.value === null || a.value === undefined) {
      out[a.name] = true;
      continue;
    }
    if (typeof a.value === 'string') {
      out[a.name] = a.value;
      continue;
    }
    const expr = a.value as MdxJsxAttributeValueExpression;
    out[a.name] = parseExpression(expr.value);
  }
  return out;
}

function parseExpression(raw: string): unknown {
  const trimmed = raw.trim();
  // Try literal JSON first — covers numbers, booleans, null, arrays, objects.
  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through */
  }
  // Try a quoted string the JSX expression already wrapped (e.g. `'hello'`).
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith('`') && trimmed.endsWith('`'))
  ) {
    return trimmed.slice(1, -1);
  }
  // Best-effort: hand back the raw expression text. Components can detect
  // the leading marker and decide what to do.
  return { __mdxExpression: raw };
}
