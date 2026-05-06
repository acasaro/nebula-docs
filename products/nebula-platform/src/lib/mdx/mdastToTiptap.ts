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
import type { MdxJsxFlowElement } from 'mdast-util-mdx';
import { parseMdx } from '@nebula-docs/mdx';

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
  const tree: Root = parseMdx(source);
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
  return {
    type: 'codeBlock',
    attrs: { language: node.lang ?? null },
    ...(text ? { content: [{ type: 'text', text }] } : {}),
  };
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
    default:
      return null;
  }
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
