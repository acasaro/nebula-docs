import { Fragment, useMemo, type ReactNode } from 'react';
import type {
  Blockquote,
  Code,
  Delete,
  Emphasis,
  Heading,
  Image,
  InlineCode,
  Link,
  List,
  ListItem,
  Paragraph,
  PhrasingContent,
  RootContent,
  Strong,
  Table,
  TableCell,
  TableRow,
  Text,
  ThematicBreak,
} from 'mdast';
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx';
import { CodeBlock, Mermaid } from '@nebula-docs/components';
import { parseMdx } from '@nebula-docs/mdx';
import { lookupComponent } from './registry';
import { attributesToProps } from './jsxAttributes';
import { cn } from '@/lib/utils';

interface MdxRendererProps {
  source: string;
  className?: string;
}

export function MdxRenderer({ source, className }: MdxRendererProps) {
  const tree = useMemo(() => parseMdx(source), [source]);
  return (
    <article className={cn('mdx-prose mx-auto max-w-3xl px-8 py-10', className)}>
      {renderChildren(tree.children, 'root')}
    </article>
  );
}

/**
 * Render a fragment of MDX without the article wrapper. Used by the
 * editor's `mdxRaw` NodeView to render opaque JSX blocks (Card, Frame,
 * Steps, etc.) at full fidelity inside the Tiptap surface.
 */
export function MdxFragment({ source }: { source: string }) {
  const tree = useMemo(() => parseMdx(source), [source]);
  return <>{renderChildren(tree.children, 'fragment')}</>;
}

type AnyNode =
  | RootContent
  | PhrasingContent
  | TableRow
  | TableCell
  | MdxJsxFlowElement
  | MdxJsxTextElement;

function renderChildren(nodes: readonly AnyNode[] | undefined, parentKey: string): ReactNode {
  if (!nodes) return null;
  return nodes.map((n, i) => renderNode(n, `${parentKey}.${i}`));
}

function renderNode(node: AnyNode, key: string): ReactNode {
  switch (node.type) {
    case 'paragraph':
      return renderParagraph(node, key);
    case 'heading':
      return renderHeading(node, key);
    case 'text':
      return renderText(node, key);
    case 'strong':
      return renderStrong(node, key);
    case 'emphasis':
      return renderEmphasis(node, key);
    case 'delete':
      return renderDelete(node, key);
    case 'inlineCode':
      return renderInlineCode(node, key);
    case 'code':
      return renderCode(node, key);
    case 'list':
      return renderList(node, key);
    case 'listItem':
      return renderListItem(node, key);
    case 'link':
      return renderLink(node, key);
    case 'image':
      return renderImage(node, key);
    case 'thematicBreak':
      return renderThematicBreak(node, key);
    case 'blockquote':
      return renderBlockquote(node, key);
    case 'table':
      return renderTable(node, key);
    case 'tableRow':
      return renderTableRow(node, key);
    case 'tableCell':
      return renderTableCell(node, key);
    case 'break':
      return <br key={key} />;
    case 'html':
      // Raw HTML — not commonly used in MDX. Render as text for now.
      return <span key={key}>{node.value}</span>;
    case 'yaml':
      // Frontmatter — surface separately later. For now, hide it from
      // the rendered body.
      return null;
    case 'mdxJsxFlowElement':
    case 'mdxJsxTextElement':
      return renderJsx(node, key);
    case 'mdxjsEsm':
    case 'mdxFlowExpression':
    case 'mdxTextExpression':
      // Expressions / imports — Phase 3 readonly skips them.
      return null;
    default:
      return renderUnknown(node, key);
  }
}

function renderParagraph(node: Paragraph, key: string): ReactNode {
  return <p key={key}>{renderChildren(node.children, key)}</p>;
}

function renderHeading(node: Heading, key: string): ReactNode {
  const Tag = `h${node.depth}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  return <Tag key={key}>{renderChildren(node.children, key)}</Tag>;
}

function renderText(node: Text, key: string): ReactNode {
  return <Fragment key={key}>{node.value}</Fragment>;
}

function renderStrong(node: Strong, key: string): ReactNode {
  return <strong key={key}>{renderChildren(node.children, key)}</strong>;
}

function renderEmphasis(node: Emphasis, key: string): ReactNode {
  return <em key={key}>{renderChildren(node.children, key)}</em>;
}

function renderDelete(node: Delete, key: string): ReactNode {
  return <del key={key}>{renderChildren(node.children, key)}</del>;
}

function renderInlineCode(node: InlineCode, key: string): ReactNode {
  return <code key={key}>{node.value}</code>;
}

function renderCode(node: Code, key: string): ReactNode {
  // Mermaid diagrams: a fenced code block with `mermaid` language renders
  // as a real diagram instead of a code block.
  if (node.lang === 'mermaid') {
    return <Mermaid key={key} chart={node.value} />;
  }
  return (
    <CodeBlock
      key={key}
      code={node.value}
      language={node.lang ?? undefined}
      filename={parseCodeMetaFilename(node.meta)}
    />
  );
}

/**
 * Extract a filename hint from a fenced code block's `meta` string.
 * Mintlify-style code blocks write meta as `<filename> [key={value}]…` —
 * the first whitespace-delimited token that isn't a `key=value` pair is the
 * filename label.
 */
function parseCodeMetaFilename(meta: string | null | undefined): string | undefined {
  if (!meta) return undefined;
  for (const token of meta.trim().split(/\s+/)) {
    if (!token) continue;
    if (/^[A-Za-z_][A-Za-z0-9_-]*=/.test(token)) continue;
    return token;
  }
  return undefined;
}

function renderList(node: List, key: string): ReactNode {
  if (node.ordered) {
    return (
      <ol key={key} start={node.start ?? undefined}>
        {renderChildren(node.children, key)}
      </ol>
    );
  }
  return <ul key={key}>{renderChildren(node.children, key)}</ul>;
}

function renderListItem(node: ListItem, key: string): ReactNode {
  return <li key={key}>{renderChildren(node.children, key)}</li>;
}

function renderLink(node: Link, key: string): ReactNode {
  return (
    <a
      key={key}
      href={node.url}
      title={node.title ?? undefined}
      target={node.url.startsWith('http') ? '_blank' : undefined}
      rel={node.url.startsWith('http') ? 'noreferrer' : undefined}
    >
      {renderChildren(node.children, key)}
    </a>
  );
}

function renderImage(node: Image, key: string): ReactNode {
  return (
    <img
      key={key}
      src={node.url}
      alt={node.alt ?? ''}
      title={node.title ?? undefined}
    />
  );
}

function renderThematicBreak(_node: ThematicBreak, key: string): ReactNode {
  return <hr key={key} />;
}

function renderBlockquote(node: Blockquote, key: string): ReactNode {
  return <blockquote key={key}>{renderChildren(node.children, key)}</blockquote>;
}

function renderTable(node: Table, key: string): ReactNode {
  const [head, ...body] = node.children;
  return (
    <table key={key}>
      {head ? <thead>{renderTableRow(head, `${key}.head`, true)}</thead> : null}
      <tbody>
        {body.map((row: TableRow, i: number) =>
          renderTableRow(row, `${key}.row.${i}`, false),
        )}
      </tbody>
    </table>
  );
}

function renderTableRow(node: TableRow, key: string, isHeader = false): ReactNode {
  return (
    <tr key={key}>
      {node.children.map((cell, i) =>
        renderTableCell(cell, `${key}.cell.${i}`, isHeader),
      )}
    </tr>
  );
}

function renderTableCell(node: TableCell, key: string, isHeader = false): ReactNode {
  const Tag = isHeader ? 'th' : 'td';
  return <Tag key={key}>{renderChildren(node.children, key)}</Tag>;
}

function renderJsx(
  node: MdxJsxFlowElement | MdxJsxTextElement,
  key: string,
): ReactNode {
  if (!node.name) return null;
  const props = attributesToProps(node);
  const children = renderChildren(node.children as readonly AnyNode[], key);

  // Lowercase tag names are intrinsic HTML elements, not user components.
  // MDX parses them into the JSX AST too, so we route them straight to
  // their native React tag.
  if (/^[a-z]/.test(node.name)) {
    return renderNativeJsx(node.name, props, children, key);
  }

  const Component = lookupComponent(node.name);
  if (Component) {
    return (
      <Component key={key} {...props}>
        {children}
      </Component>
    );
  }
  return renderUnknownJsx(node.name, props, children, key);
}

const SELF_CLOSING_TAGS = new Set([
  'br',
  'hr',
  'img',
  'input',
  'meta',
  'link',
  'source',
  'area',
  'base',
  'col',
  'embed',
  'param',
  'track',
  'wbr',
]);

function renderNativeJsx(
  name: string,
  props: Record<string, unknown>,
  children: ReactNode,
  key: string,
): ReactNode {
  const sanitized = sanitizeNativeProps(props);
  if (SELF_CLOSING_TAGS.has(name)) {
    const { Tag } = { Tag: name as keyof React.JSX.IntrinsicElements };
    return <Tag key={key} {...(sanitized as React.JSX.IntrinsicAttributes)} />;
  }
  const Tag = name as keyof React.JSX.IntrinsicElements;
  return (
    <Tag key={key} {...(sanitized as React.JSX.IntrinsicAttributes)}>
      {children}
    </Tag>
  );
}

/**
 * MDX style props can come back as `__mdxExpression`-wrapped objects; pass
 * those through as-is wouldn't work for native React elements. For the
 * common case of `style={{ width: '67%' }}`, we try a cheap eval of the
 * expression text via JSON5-ish coercion. Anything we can't coerce is
 * dropped (better than crashing the renderer).
 */
function sanitizeNativeProps(
  props: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (
      value &&
      typeof value === 'object' &&
      '__mdxExpression' in value &&
      key === 'style'
    ) {
      const parsed = tryParseStyleExpr(
        (value as { __mdxExpression: string }).__mdxExpression,
      );
      if (parsed) out[key] = parsed;
      continue;
    }
    if (value && typeof value === 'object' && '__mdxExpression' in value) {
      // Skip arbitrary expressions we can't safely materialize — better
      // than crashing React with an invalid prop.
      continue;
    }
    out[key] = value;
  }
  return out;
}

function tryParseStyleExpr(raw: string): Record<string, string> | null {
  // Common shape: `{{ width: "67%" }}` — strip wrapping braces, replace
  // unquoted keys with quoted keys, JSON.parse.
  const trimmed = raw.trim();
  const inner = trimmed.replace(/^\{\s*/, '').replace(/\s*\}$/, '');
  const objectish = `{${inner}}`;
  try {
    const quoted = objectish.replace(
      /([{,]\s*)([A-Za-z_][A-Za-z0-9_-]*)\s*:/g,
      '$1"$2":',
    );
    return JSON.parse(quoted) as Record<string, string>;
  } catch {
    return null;
  }
}

function renderUnknownJsx(
  name: string,
  props: Record<string, unknown>,
  children: ReactNode,
  key: string,
): ReactNode {
  const propPairs = Object.entries(props);
  return (
    <div
      key={key}
      className="my-4 rounded-md border border-dashed border-border bg-muted/30 p-3 text-sm"
    >
      <div className="mb-2 flex flex-wrap items-baseline gap-2 font-mono text-xs">
        <span className="font-semibold text-amber-500">&lt;{name}&gt;</span>
        <span className="text-muted-foreground">unregistered component</span>
      </div>
      {propPairs.length > 0 ? (
        <dl className="mb-2 grid grid-cols-[max-content_1fr] gap-x-3 gap-y-1 font-mono text-xs">
          {propPairs.map(([k, v]) => (
            <Fragment key={k}>
              <dt className="text-muted-foreground">{k}</dt>
              <dd className="break-all text-foreground/80">{stringify(v)}</dd>
            </Fragment>
          ))}
        </dl>
      ) : null}
      {children ? <div className="mt-2 border-t pt-2">{children}</div> : null}
    </div>
  );
}

function renderUnknown(node: { type: string }, key: string): ReactNode {
  return (
    <div
      key={key}
      className="my-2 rounded-md border border-dashed border-destructive/40 bg-destructive/5 p-2 text-xs font-mono text-destructive"
    >
      Unhandled MDAST node: <strong>{node.type}</strong>
    </div>
  );
}

function stringify(v: unknown): string {
  if (v === null) return 'null';
  if (typeof v === 'string') return JSON.stringify(v);
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  if (typeof v === 'object' && v && '__mdxExpression' in v) {
    return `{${(v as { __mdxExpression: string }).__mdxExpression}}`;
  }
  return JSON.stringify(v);
}
