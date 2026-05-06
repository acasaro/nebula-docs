import type {
  Blockquote,
  Code,
  Delete,
  Emphasis,
  Heading,
  List,
  ListItem,
  Paragraph,
  PhrasingContent,
  Root,
  RootContent,
  Strong,
  Text,
  ThematicBreak,
} from 'mdast';
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx';
import { parseMdx } from '@nebula-docs/mdx';
import { splitFrontmatter } from '@/lib/frontmatter';

const CALLOUT_NAMES = new Set([
  'Note',
  'Tip',
  'Info',
  'Check',
  'Warning',
  'Danger',
  'Callout',
]);

function calloutVariantFor(name: string, attrs: Record<string, unknown>): string {
  if (name === 'Callout') {
    const t = attrs.type ?? attrs.variant;
    return typeof t === 'string' ? t : 'custom';
  }
  return name.toLowerCase();
}

function extractAttrs(node: MdxJsxFlowElement): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const a of node.attributes ?? []) {
    if (a.type !== 'mdxJsxAttribute') continue;
    const v = a.value;
    if (v == null) {
      out[a.name] = true;
    } else if (typeof v === 'string') {
      out[a.name] = v;
    } else if (typeof v === 'object' && 'value' in v && typeof v.value === 'string') {
      const expr = v.value.trim();
      try {
        out[a.name] = JSON.parse(expr);
      } catch {
        if (expr === 'true') out[a.name] = true;
        else if (expr === 'false') out[a.name] = false;
        else out[a.name] = { __expression: expr };
      }
    }
  }
  return out;
}

export interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

export interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
}

export interface TiptapDoc {
  type: 'doc';
  content: TiptapNode[];
}

export function mdxToTiptapDoc(source: string): TiptapDoc {
  let tree: Root;
  try {
    tree = parseMdx(source);
  } catch {
    // Files with malformed JSX (e.g. 4-backtick fences containing
    // unclosed-looking tags) trip @mdx-js/mdx's parser. Don't unmount the
    // editor over it — surface the file as a single opaque MdxRaw block so
    // the user can still see, switch to source mode, and fix it by hand.
    // Strip frontmatter so MdxEditor's onUpdate path doesn't double-prepend
    // it (it always re-attaches the current frontmatter to the emitted body).
    const split = splitFrontmatter(source);
    const body = split.frontmatter ? split.body : source;
    return {
      type: 'doc',
      content: [{ type: 'mdxRaw', attrs: { source: body } }],
    };
  }
  const content: TiptapNode[] = [];
  for (const node of tree.children) {
    const converted = convertBlock(node, source);
    if (converted) content.push(converted);
  }
  if (content.length === 0) content.push({ type: 'paragraph' });
  return { type: 'doc', content };
}

function convertBlock(node: RootContent, source: string): TiptapNode | null {
  switch (node.type) {
    case 'paragraph':
      return convertParagraph(node, source);
    case 'heading':
      return convertHeading(node, source);
    case 'list':
      return convertList(node, source);
    case 'blockquote':
      return convertBlockquote(node, source);
    case 'code':
      return convertCode(node);
    case 'thematicBreak':
      return convertThematicBreak(node);
    case 'yaml':
      return null;
    case 'mdxJsxFlowElement': {
      const jsx = node as MdxJsxFlowElement;
      const name = jsx.name;
      if (name && CALLOUT_NAMES.has(name)) return convertCallout(jsx, source);
      if (name === 'Card') return convertSimpleBlock(jsx, source, 'mdxCard');
      if (name === 'Frame') return convertSimpleBlock(jsx, source, 'mdxFrame');
      if (name === 'Update') return convertSimpleBlock(jsx, source, 'mdxUpdate');
      if (name === 'Steps') return convertSteps(jsx, source);
      if (name === 'Tabs') return convertTabs(jsx, source);
      if (name === 'Accordion') return convertAccordion(jsx, source);
      if (name === 'AccordionGroup') return convertAccordionGroup(jsx, source);
      if (name === 'Columns') return convertColumns(jsx, source);
      if (name === 'CardGroup') return convertCardGroup(jsx, source);
      if (name === 'Expandable') return convertExpandable(jsx, source);
      if (name === 'Tree') return convertTree(jsx, source);
      if (name === 'ParamField')
        return convertGenericBlock(jsx, source, 'mdxParamField');
      if (name === 'ResponseField')
        return convertGenericBlock(jsx, source, 'mdxResponseField');
      if (name === 'RequestExample')
        return convertGenericBlock(jsx, source, 'mdxRequestExample');
      if (name === 'ResponseExample')
        return convertGenericBlock(jsx, source, 'mdxResponseExample');
      if (name === 'Mermaid') return convertMermaid(jsx, source);
      if (name === 'CodeGroup') return convertCodeGroup(jsx);
      if (name === 'Badge') {
        // MDX parses a standalone `<Badge>...</Badge>` line as a flow element.
        // Wrap it in a paragraph so it round-trips through the inline node.
        const badge = convertStandaloneInlineBadge(jsx);
        return { type: 'paragraph', content: [badge] };
      }
      return rawBlock(node, source);
    }
    default:
      return rawBlock(node, source);
  }
}

function convertSimpleBlock(
  node: MdxJsxFlowElement,
  source: string,
  type: 'mdxCard' | 'mdxFrame' | 'mdxUpdate',
): TiptapNode {
  const attrs = extractAttrs(node);
  const content: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    const conv = convertBlock(child as RootContent, source);
    if (conv) content.push(conv);
  }
  if (content.length === 0) content.push({ type: 'paragraph' });
  return { type, attrs, content };
}

function convertSteps(node: MdxJsxFlowElement, source: string): TiptapNode {
  const attrs = extractAttrs(node);
  const items: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    if (
      child.type === 'mdxJsxFlowElement' &&
      (child as MdxJsxFlowElement).name === 'Step'
    ) {
      const stepNode = child as MdxJsxFlowElement;
      const stepAttrs = extractAttrs(stepNode);
      const stepContent: TiptapNode[] = [];
      for (const sc of stepNode.children ?? []) {
        const conv = convertBlock(sc as RootContent, source);
        if (conv) stepContent.push(conv);
      }
      if (stepContent.length === 0) stepContent.push({ type: 'paragraph' });
      items.push({ type: 'mdxStep', attrs: stepAttrs, content: stepContent });
    }
  }
  if (items.length === 0) {
    items.push({
      type: 'mdxStep',
      attrs: {},
      content: [{ type: 'paragraph' }],
    });
  }
  return { type: 'mdxSteps', attrs, content: items };
}

function convertTabs(node: MdxJsxFlowElement, source: string): TiptapNode {
  const attrs = extractAttrs(node);
  const items: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    if (
      child.type === 'mdxJsxFlowElement' &&
      (child as MdxJsxFlowElement).name === 'Tab'
    ) {
      const tabNode = child as MdxJsxFlowElement;
      const tabAttrs = extractAttrs(tabNode);
      const tabContent: TiptapNode[] = [];
      for (const tc of tabNode.children ?? []) {
        const conv = convertBlock(tc as RootContent, source);
        if (conv) tabContent.push(conv);
      }
      if (tabContent.length === 0) tabContent.push({ type: 'paragraph' });
      items.push({ type: 'mdxTab', attrs: tabAttrs, content: tabContent });
    }
  }
  if (items.length === 0) {
    items.push({
      type: 'mdxTab',
      attrs: { title: null },
      content: [{ type: 'paragraph' }],
    });
  }
  return { type: 'mdxTabs', attrs, content: items };
}

function convertAccordion(node: MdxJsxFlowElement, source: string): TiptapNode {
  const attrs = extractAttrs(node);
  const content: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    const conv = convertBlock(child as RootContent, source);
    if (conv) content.push(conv);
  }
  if (content.length === 0) content.push({ type: 'paragraph' });
  return { type: 'mdxAccordion', attrs, content };
}

function convertAccordionGroup(
  node: MdxJsxFlowElement,
  source: string,
): TiptapNode {
  const items: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    if (
      child.type === 'mdxJsxFlowElement' &&
      (child as MdxJsxFlowElement).name === 'Accordion'
    ) {
      items.push(convertAccordion(child as MdxJsxFlowElement, source));
    }
  }
  if (items.length === 0) {
    items.push({
      type: 'mdxAccordion',
      attrs: { title: null },
      content: [{ type: 'paragraph' }],
    });
  }
  return { type: 'mdxAccordionGroup', content: items };
}

function convertColumns(node: MdxJsxFlowElement, source: string): TiptapNode {
  const attrs = extractAttrs(node);
  const items: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    if (
      child.type === 'mdxJsxFlowElement' &&
      (child as MdxJsxFlowElement).name === 'Column'
    ) {
      const colNode = child as MdxJsxFlowElement;
      const colContent: TiptapNode[] = [];
      for (const cc of colNode.children ?? []) {
        const conv = convertBlock(cc as RootContent, source);
        if (conv) colContent.push(conv);
      }
      if (colContent.length === 0) colContent.push({ type: 'paragraph' });
      items.push({ type: 'mdxColumn', content: colContent });
    }
  }
  if (items.length === 0) {
    items.push({ type: 'mdxColumn', content: [{ type: 'paragraph' }] });
  }
  return { type: 'mdxColumns', attrs, content: items };
}

function convertCardGroup(node: MdxJsxFlowElement, source: string): TiptapNode {
  const attrs = extractAttrs(node);
  const cards: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    if (
      child.type === 'mdxJsxFlowElement' &&
      (child as MdxJsxFlowElement).name === 'Card'
    ) {
      cards.push(convertSimpleBlock(child as MdxJsxFlowElement, source, 'mdxCard'));
    }
  }
  if (cards.length === 0) {
    cards.push({
      type: 'mdxCard',
      attrs: { title: 'Card title' },
      content: [{ type: 'paragraph' }],
    });
  }
  return { type: 'mdxCardGroup', attrs, content: cards };
}

function convertExpandable(
  node: MdxJsxFlowElement,
  source: string,
): TiptapNode {
  const attrs = extractAttrs(node);
  const content: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    const conv = convertBlock(child as RootContent, source);
    if (conv) content.push(conv);
  }
  if (content.length === 0) content.push({ type: 'paragraph' });
  return { type: 'mdxExpandable', attrs, content };
}

function convertTree(node: MdxJsxFlowElement, source: string): TiptapNode {
  const items = collectTreeItems(node, source);
  return { type: 'mdxTree', content: items };
}

function convertGenericBlock(
  node: MdxJsxFlowElement,
  source: string,
  type: string,
): TiptapNode {
  const attrs = extractAttrs(node);
  const content: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    const conv = convertBlock(child as RootContent, source);
    if (conv) content.push(conv);
  }
  if (content.length === 0) content.push({ type: 'paragraph' });
  return { type, attrs, content };
}

function convertMermaid(node: MdxJsxFlowElement, source: string): TiptapNode {
  const rawAttrs = extractAttrs(node);
  let chart = '';
  if (typeof rawAttrs.chart === 'string') {
    chart = rawAttrs.chart;
  } else if (
    rawAttrs.chart &&
    typeof rawAttrs.chart === 'object' &&
    '__expression' in rawAttrs.chart &&
    typeof (rawAttrs.chart as { __expression: unknown }).__expression === 'string'
  ) {
    // Try to parse the expression as a JSON-quoted string or a template literal.
    const raw = (rawAttrs.chart as { __expression: string }).__expression.trim();
    try {
      chart = JSON.parse(raw);
    } catch {
      // Strip surrounding backticks if a template literal.
      chart = raw.replace(/^`/, '').replace(/`$/, '');
    }
  } else {
    // No chart attribute — pull text from the JSX body.
    chart = extractTextChildren(node, source).trim();
  }
  return { type: 'mdxMermaid', attrs: { chart } };
}

function extractTextChildren(
  node: MdxJsxFlowElement,
  source: string,
): string {
  const parts: string[] = [];
  for (const child of node.children ?? []) {
    if (child.type === 'paragraph') {
      const start = child.position?.start?.offset;
      const end = child.position?.end?.offset;
      if (start != null && end != null) {
        parts.push(source.slice(start, end));
      }
    } else if (child.type === 'mdxFlowExpression') {
      const expr = (child as { value?: string }).value ?? '';
      try {
        parts.push(JSON.parse(expr.trim()));
      } catch {
        parts.push(expr.replace(/^`/, '').replace(/`$/, ''));
      }
    }
  }
  return parts.join('\n');
}

function collectTreeItems(
  parent: MdxJsxFlowElement,
  source: string,
): TiptapNode[] {
  const items: TiptapNode[] = [];
  for (const child of parent.children ?? []) {
    if (child.type !== 'mdxJsxFlowElement') continue;
    const jsx = child as MdxJsxFlowElement;
    if (jsx.name === 'Tree.Folder') {
      const attrs = extractAttrs(jsx);
      items.push({
        type: 'mdxTreeFolder',
        attrs,
        content: collectTreeItems(jsx, source),
      });
    } else if (jsx.name === 'Tree.File') {
      const attrs = extractAttrs(jsx);
      items.push({ type: 'mdxTreeFile', attrs });
    }
  }
  return items;
}

function convertCallout(node: MdxJsxFlowElement, source: string): TiptapNode {
  const attrs: Record<string, unknown> = {};
  for (const a of node.attributes ?? []) {
    if (a.type === 'mdxJsxAttribute' && typeof a.value === 'string') {
      attrs[a.name] = a.value;
    }
  }
  const variant = calloutVariantFor(node.name ?? 'Callout', attrs);
  const content: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    const conv = convertBlock(child as RootContent, source);
    if (conv) content.push(conv);
  }
  if (content.length === 0) content.push({ type: 'paragraph' });
  return {
    type: 'mdxCallout',
    attrs: { variant },
    content,
  };
}

function convertParagraph(node: Paragraph, source: string): TiptapNode {
  const inline = convertInline(node.children);
  if (!inline) return rawBlock(node, source);
  return { type: 'paragraph', ...(inline.length ? { content: inline } : {}) };
}

function convertHeading(node: Heading, source: string): TiptapNode {
  const inline = convertInline(node.children);
  if (!inline) return rawBlock(node, source);
  return {
    type: 'heading',
    attrs: { level: node.depth },
    ...(inline.length ? { content: inline } : {}),
  };
}

function convertList(node: List, source: string): TiptapNode {
  const items: TiptapNode[] = [];
  for (const child of node.children) {
    items.push(convertListItem(child, source));
  }
  const attrs: Record<string, unknown> = {};
  if (node.ordered && node.start != null) attrs.start = node.start;
  return {
    type: node.ordered ? 'orderedList' : 'bulletList',
    ...(Object.keys(attrs).length ? { attrs } : {}),
    content: items,
  };
}

function convertListItem(node: ListItem, source: string): TiptapNode {
  const content: TiptapNode[] = [];
  for (const child of node.children) {
    const conv = convertBlock(child as RootContent, source);
    if (conv) content.push(conv);
  }
  if (content.length === 0) content.push({ type: 'paragraph' });
  return { type: 'listItem', content };
}

function convertBlockquote(node: Blockquote, source: string): TiptapNode {
  const content: TiptapNode[] = [];
  for (const child of node.children) {
    const conv = convertBlock(child as RootContent, source);
    if (conv) content.push(conv);
  }
  if (content.length === 0) content.push({ type: 'paragraph' });
  return { type: 'blockquote', content };
}

function convertCode(node: Code): TiptapNode {
  const text = node.value ?? '';
  const filename = parseFilenameFromMeta(node.meta);
  return {
    type: 'codeBlock',
    attrs: {
      language: node.lang ?? null,
      filename: filename ?? null,
    },
    ...(text ? { content: [{ type: 'text', text }] } : {}),
  };
}

function parseFilenameFromMeta(meta: string | null | undefined): string | undefined {
  if (!meta) return undefined;
  for (const token of meta.trim().split(/\s+/)) {
    if (!token) continue;
    if (/^[A-Za-z_][A-Za-z0-9_-]*=/.test(token)) continue;
    return token;
  }
  return undefined;
}

function convertCodeGroup(node: MdxJsxFlowElement): TiptapNode {
  const attrs = extractAttrs(node);
  const items: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    if (child.type === 'code') {
      items.push(convertCode(child));
    }
  }
  if (items.length === 0) {
    items.push({
      type: 'codeBlock',
      attrs: { language: 'text', filename: null },
    });
  }
  return { type: 'mdxCodeGroup', attrs, content: items };
}

function convertThematicBreak(_node: ThematicBreak): TiptapNode {
  return { type: 'horizontalRule' };
}

function rawBlock(
  node: { position?: { start?: { offset?: number }; end?: { offset?: number } } },
  source: string,
): TiptapNode {
  const start = node.position?.start?.offset ?? 0;
  const end = node.position?.end?.offset ?? source.length;
  return { type: 'mdxRaw', attrs: { source: source.slice(start, end) } };
}

function convertInline(nodes: PhrasingContent[]): TiptapNode[] | null {
  const out: TiptapNode[] = [];
  for (const node of nodes) {
    const converted = convertInlineNode(node, []);
    if (!converted) return null;
    out.push(...converted);
  }
  return out;
}

function convertInlineNode(
  node: PhrasingContent,
  marks: TiptapMark[],
): TiptapNode[] | null {
  switch (node.type) {
    case 'text':
      return [textNode(node, marks)];
    case 'strong':
      return convertWithMark(node, marks, { type: 'bold' });
    case 'emphasis':
      return convertWithMark(node, marks, { type: 'italic' });
    case 'delete':
      return convertWithMark(node, marks, { type: 'strike' });
    case 'inlineCode':
      return [{ type: 'text', text: node.value, marks: [...marks, { type: 'code' }] }];
    case 'break':
      return [{ type: 'hardBreak' }];
    case 'mdxJsxTextElement': {
      const jsx = node as MdxJsxTextElement;
      if (jsx.name === 'Badge') return [convertInlineBadge(jsx)];
      return null;
    }
    default:
      return null;
  }
}

function convertInlineBadge(node: MdxJsxTextElement): TiptapNode {
  const attrs: Record<string, unknown> = {};
  for (const a of node.attributes ?? []) {
    if (a.type !== 'mdxJsxAttribute') continue;
    if (typeof a.value === 'string') attrs[a.name] = a.value;
    else if (a.value === null) attrs[a.name] = true;
  }
  let label = '';
  for (const child of node.children ?? []) {
    if (child.type === 'text') label += child.value;
  }
  return {
    type: 'mdxBadge',
    attrs: { ...attrs, label: label.trim() },
  };
}

function convertStandaloneInlineBadge(node: MdxJsxFlowElement): TiptapNode {
  const attrs: Record<string, unknown> = {};
  for (const a of node.attributes ?? []) {
    if (a.type !== 'mdxJsxAttribute') continue;
    if (typeof a.value === 'string') attrs[a.name] = a.value;
    else if (a.value === null) attrs[a.name] = true;
  }
  let label = '';
  for (const child of node.children ?? []) {
    if (child.type === 'paragraph') {
      for (const inline of child.children ?? []) {
        if (inline.type === 'text') label += inline.value;
      }
    }
  }
  return {
    type: 'mdxBadge',
    attrs: { ...attrs, label: label.trim() },
  };
}

function textNode(node: Text, marks: TiptapMark[]): TiptapNode {
  return { type: 'text', text: node.value, ...(marks.length ? { marks } : {}) };
}

function convertWithMark(
  node: Strong | Emphasis | Delete,
  existing: TiptapMark[],
  add: TiptapMark,
): TiptapNode[] | null {
  const out: TiptapNode[] = [];
  const next = [...existing, add];
  for (const child of node.children) {
    const converted = convertInlineNode(child as PhrasingContent, next);
    if (!converted) return null;
    out.push(...converted);
  }
  return out;
}
