import type {
  Blockquote,
  Code,
  Delete,
  Emphasis,
  Heading,
  Image,
  List,
  ListItem,
  Paragraph,
  PhrasingContent,
  Root,
  RootContent,
  Strong,
  Table,
  TableCell as TableCellNode,
  TableRow as TableRowNode,
  Text,
  ThematicBreak,
} from 'mdast';
import type { MdxJsxFlowElement, MdxJsxTextElement } from 'mdast-util-mdx';
import { extractImports, parseMdx, type ImportSpec } from '@nebula-docs/mdx';
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

/** Result of parsing an MDX page into editor state. The body lives in
 *  `doc`; imports are surfaced separately so `MdxEditor` can reconstruct
 *  them on serialize without polluting the visible editor canvas. */
export interface MdxParseResult {
  doc: TiptapDoc;
  /** All `import` declarations found in the source — preserved verbatim
   *  on save (filtered down to the bindings actually referenced in the
   *  body so unused imports don't pile up). */
  imports: ImportSpec[];
}

export function mdxToTiptapDoc(source: string): TiptapDoc {
  return parseMdxForEditor(source).doc;
}

/**
 * Full editor parse: returns both the Tiptap doc body and the page's
 * import statements as a structured list. Imports are stripped from the
 * Tiptap body (they're metadata managed by `MdxEditor`'s `importsRef`)
 * and any JSX whose tag name matches an imported binding becomes an
 * `mdxImportedSnippet` atom node carrying the binding + import path.
 */
export function parseMdxForEditor(source: string): MdxParseResult {
  let tree: Root;
  try {
    tree = parseMdx(source);
  } catch {
    // Files with malformed JSX trip @mdx-js/mdx's parser. Surface the file
    // as a single opaque MdxRaw block so the editor still mounts.
    const split = splitFrontmatter(source);
    const body = split.frontmatter ? split.body : source;
    return {
      doc: { type: 'doc', content: [{ type: 'mdxRaw', attrs: { source: body } }] },
      imports: [],
    };
  }
  const imports = extractImports(tree);
  const bindingMap = new Map<string, ImportSpec>();
  for (const spec of imports) bindingMap.set(spec.binding, spec);

  // Pre-pass: merge adjacent light/dark `<img>` pairs (Mintlify convention)
  // into a single node carrying both variants. Done on the mdast tree
  // before conversion so every block-iterating converter sees the merged
  // shape — no per-converter changes needed.
  mergeAdjacentLightDarkImgs(tree);

  const ctx: ConvertCtx = { source, bindingMap };
  const content: TiptapNode[] = [];
  for (const node of tree.children) {
    if (node.type === 'mdxjsEsm') continue; // imports/exports — stored separately
    const converted = convertBlock(node, ctx);
    if (converted) content.push(converted);
  }
  if (content.length === 0) content.push({ type: 'paragraph' });
  return { doc: { type: 'doc', content }, imports };
}

/** Threaded through every block-level converter so JSX whose tag name
 *  matches an imported binding becomes an `mdxImportedSnippet` atom. */
interface ConvertCtx {
  source: string;
  bindingMap: Map<string, ImportSpec>;
}

function convertBlock(node: RootContent, ctx: ConvertCtx): TiptapNode | null {
  const { source, bindingMap } = ctx;
  switch (node.type) {
    case 'paragraph':
      return convertParagraph(node, ctx);
    case 'heading':
      return convertHeading(node, source);
    case 'list':
      return convertList(node, ctx);
    case 'blockquote':
      return convertBlockquote(node, ctx);
    case 'table':
      return convertTable(node as Table, ctx);
    case 'code':
      return convertCode(node);
    case 'thematicBreak':
      return convertThematicBreak(node);
    case 'yaml':
      return null;
    case 'mdxjsEsm':
      return null;
    case 'mdxJsxFlowElement': {
      const jsx = node as MdxJsxFlowElement;
      const name = jsx.name;
      // Imported snippet — `<Disclaimer />` after `import Disclaimer from
      // "/snippets/disclaimer.mdx"`. Resolved at render time by the
      // NodeView; round-tripped back to the JSX tag on serialize.
      if (name && bindingMap.has(name)) {
        return convertImportedSnippet(jsx, bindingMap.get(name)!);
      }
      if (name && CALLOUT_NAMES.has(name)) return convertCallout(jsx, ctx);
      if (name === 'Card') return convertSimpleBlock(jsx, ctx, 'mdxCard');
      if (name === 'FeatureCard') return convertFeatureCard(jsx, ctx);
      if (name === 'FeatureCardGroup')
        return convertFeatureCardGroup(jsx, ctx);
      if (name === 'Frame') return convertSimpleBlock(jsx, ctx, 'mdxFrame');
      if (name === 'Sheet') return convertSimpleBlock(jsx, ctx, 'mdxSheet');
      if (name === 'MediaCard') return convertMediaCard(jsx);
      if (name === 'StageList') return convertStageList(jsx);
      if (name === 'Stats') return convertStats(jsx);
      if (name === 'TopicCard') return convertTopicCard(jsx);
      if (name === 'Stage') return convertStageAtom(jsx);
      if (name === 'Update') return convertSimpleBlock(jsx, ctx, 'mdxUpdate');
      if (name === 'Steps') return convertSteps(jsx, ctx);
      if (name === 'Tabs') return convertTabs(jsx, ctx);
      if (name === 'Accordion') return convertAccordion(jsx, ctx);
      if (name === 'AccordionGroup') return convertAccordionGroup(jsx, ctx);
      if (name === 'Columns') return convertColumns(jsx, ctx);
      if (name === 'CardGroup') return convertCardGroup(jsx, ctx);
      if (name === 'Expandable') return convertExpandable(jsx, ctx);
      if (name === 'Tree') return convertTree(jsx, ctx);
      if (name === 'ParamField')
        return convertGenericBlock(jsx, ctx, 'mdxParamField');
      if (name === 'ResponseField')
        return convertGenericBlock(jsx, ctx, 'mdxResponseField');
      if (name === 'RequestExample')
        return convertGenericBlock(jsx, ctx, 'mdxRequestExample');
      if (name === 'ResponseExample')
        return convertGenericBlock(jsx, ctx, 'mdxResponseExample');
      if (name === 'Mermaid') return convertMermaid(jsx, source);
      if (name === 'CodeGroup') return convertCodeGroup(jsx);
      if (name === 'Badge') {
        // MDX parses a standalone `<Badge>...</Badge>` line as a flow element.
        // Wrap it in a paragraph so it round-trips through the inline node.
        const badge = convertStandaloneInlineBadge(jsx);
        return { type: 'paragraph', content: [badge] };
      }
      if (name === 'Tooltip') {
        const tip = convertStandaloneInlineTooltip(jsx);
        return { type: 'paragraph', content: [tip] };
      }
      if (name === 'img') {
        // JSX `<img>` (single, or the pre-merged light/dark pair from the
        // mergeAdjacentLightDarkImgs pre-pass).
        return convertJsxImg(jsx);
      }
      if (name === 'Video' || name === 'VideoLoop') {
        return convertVideo(jsx);
      }
      if (name === 'Profile') {
        return convertProfile(jsx);
      }
      if (name === 'Hero') {
        return convertHero(jsx);
      }
      return rawBlock(node, source);
    }
    default:
      return rawBlock(node, source);
  }
}

function convertSimpleBlock(
  node: MdxJsxFlowElement,
  ctx: ConvertCtx,
  type: 'mdxCard' | 'mdxFeatureCard' | 'mdxFrame' | 'mdxSheet' | 'mdxUpdate',
): TiptapNode {
  const attrs = extractAttrs(node);
  const content: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    const conv = convertBlock(child as RootContent, ctx);
    if (conv) content.push(conv);
  }
  if (content.length === 0) content.push({ type: 'paragraph' });
  return { type, attrs, content };
}

/**
 * FeatureCard's title slot is a content sub-node (`mdxFeatureCardTitle`) in
 * the editor so the bubble menu can apply marks and change the heading
 * level. On disk it round-trips as flat attrs on the parent JSX:
 *   `<FeatureCard title="..." titleLevel={N}>`
 *
 * Title text is the `title` attr; heading level is the `titleLevel` attr
 * (omitted when 3, the default). Marks inside the title are POC-lossy.
 *
 * For back-compat we also accept the previous `<FeatureCardTitle level={N}>`
 * JSX child shape (it landed in earlier saves) and lift it into the same
 * sub-node — but we never re-emit that shape; the next save flattens it
 * back to attrs. The Astro+React+MDX boundary pre-renders nested React
 * children to strings before they reach a React parent component, so the
 * JSX-child shape couldn't actually render in the CLI; flat attrs sidestep
 * that boundary.
 */
function convertFeatureCard(
  node: MdxJsxFlowElement,
  ctx: ConvertCtx,
): TiptapNode {
  const allAttrs = extractAttrs(node);
  const fallbackTitle =
    typeof allAttrs.title === 'string' ? allAttrs.title : '';
  const fallbackLevel = (() => {
    const n = Number(allAttrs.titleLevel);
    return Number.isFinite(n) && n >= 1 && n <= 4 ? n : 3;
  })();
  const { title: _t, titleLevel: _l, ...attrs } = allAttrs;

  let titleInline: TiptapNode[] | null = null;
  let titleLevel = fallbackLevel;
  const body: TiptapNode[] = [];

  // Back-compat: extract a `<FeatureCardTitle>` JSX child if present.
  // MDX may emit it as either an `mdxJsxFlowElement` (when on its own line
  // surrounded by blank lines) or as an `mdxJsxTextElement` wrapped in a
  // paragraph (the default for inline JSX inside a flow JSX parent).
  const extractFromTitleEl = (
    titleEl: MdxJsxFlowElement | MdxJsxTextElement,
  ) => {
    const titleAttrs: Record<string, unknown> = {};
    for (const a of titleEl.attributes ?? []) {
      if (a.type !== 'mdxJsxAttribute') continue;
      const v = a.value;
      if (v == null) titleAttrs[a.name] = true;
      else if (typeof v === 'string') titleAttrs[a.name] = v;
      else if (typeof v === 'object' && 'value' in v && typeof v.value === 'string') {
        const expr = v.value.trim();
        try {
          titleAttrs[a.name] = JSON.parse(expr);
        } catch {
          titleAttrs[a.name] = expr;
        }
      }
    }
    const lvl = Number(titleAttrs.level);
    if (Number.isFinite(lvl) && lvl >= 1 && lvl <= 4) titleLevel = lvl;
    titleInline = [];
    for (const tc of titleEl.children ?? []) {
      if (tc.type === 'paragraph') {
        const conv = convertInline(
          (tc as { children: PhrasingContent[] }).children,
        );
        if (conv) titleInline!.push(...conv);
      } else {
        const conv = convertInline([tc as PhrasingContent]);
        if (conv) titleInline!.push(...conv);
      }
    }
  };

  for (const child of node.children ?? []) {
    if (
      child.type === 'mdxJsxFlowElement' &&
      (child as MdxJsxFlowElement).name === 'FeatureCardTitle'
    ) {
      extractFromTitleEl(child as MdxJsxFlowElement);
      continue;
    }
    if (
      child.type === 'paragraph' &&
      Array.isArray((child as { children?: unknown[] }).children)
    ) {
      const inlineChildren = (child as { children: { type: string; name?: string }[] }).children;
      const onlyTitleIdx = inlineChildren.findIndex(
        (c) => c.type === 'mdxJsxTextElement' && c.name === 'FeatureCardTitle',
      );
      if (
        onlyTitleIdx !== -1 &&
        inlineChildren.every(
          (c, i) =>
            i === onlyTitleIdx ||
            (c.type === 'text' && !(c as unknown as { value: string }).value.trim()),
        )
      ) {
        extractFromTitleEl(inlineChildren[onlyTitleIdx] as unknown as MdxJsxTextElement);
        continue;
      }
    }
    const conv = convertBlock(child as RootContent, ctx);
    if (conv) body.push(conv);
  }

  if (!titleInline) {
    titleInline = fallbackTitle
      ? [{ type: 'text', text: fallbackTitle }]
      : [];
  }

  const titleNode: TiptapNode = {
    type: 'mdxFeatureCardTitle',
    attrs: { level: titleLevel },
    content: titleInline,
  };
  return { type: 'mdxFeatureCard', attrs, content: [titleNode, ...body] };
}

/** FeatureCardGroup's content schema is `mdxFeatureCard+`, so the
 *  paragraph fallback used by `convertSimpleBlock` would produce an
 *  invalid Tiptap doc. Drop non-FeatureCard children silently (lossy)
 *  and fall back to a single empty FeatureCard if the parent serialized
 *  empty. */
function convertFeatureCardGroup(
  node: MdxJsxFlowElement,
  ctx: ConvertCtx,
): TiptapNode {
  const attrs = extractAttrs(node);
  const content: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    const conv = convertBlock(child as RootContent, ctx);
    if (conv && conv.type === 'mdxFeatureCard') content.push(conv);
  }
  if (content.length === 0) {
    content.push({
      type: 'mdxFeatureCard',
      attrs: { color: 'blue', accent: 'top-bar' },
      content: [
        { type: 'mdxFeatureCardTitle', content: [] },
        { type: 'paragraph' },
      ],
    });
  }
  return { type: 'mdxFeatureCardGroup', attrs, content };
}

function convertStageList(node: MdxJsxFlowElement): TiptapNode {
  const content: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    if (
      child.type === 'mdxJsxFlowElement' &&
      (child as MdxJsxFlowElement).name === 'Stage'
    ) {
      content.push(convertStageAtom(child as MdxJsxFlowElement));
    }
  }
  if (content.length === 0) {
    content.push({
      type: 'mdxStage',
      attrs: { label: 'Stage', status: 'pending' },
    });
  }
  return { type: 'mdxStageList', content };
}

function convertStageAtom(node: MdxJsxFlowElement): TiptapNode {
  const attrs = extractAttrs(node);
  return {
    type: 'mdxStage',
    attrs: {
      label: typeof attrs.label === 'string' ? attrs.label : null,
      status: typeof attrs.status === 'string' ? attrs.status : null,
      meta: typeof attrs.meta === 'string' ? attrs.meta : null,
    },
  };
}

/** Stats's content schema is `mdxStat+`. Drop non-Stat children (lossy)
 *  and fall back to a single empty Stat if the parent serialized empty. */
function convertStats(node: MdxJsxFlowElement): TiptapNode {
  const attrs = extractAttrs(node);
  const content: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    if (
      child.type === 'mdxJsxFlowElement' &&
      (child as MdxJsxFlowElement).name === 'Stat'
    ) {
      content.push(convertStatAtom(child as MdxJsxFlowElement));
    }
  }
  if (content.length === 0) {
    content.push({
      type: 'mdxStat',
      attrs: { value: null, label: null, color: null },
    });
  }
  return {
    type: 'mdxStats',
    attrs: {
      columns: typeof attrs.columns === 'number' ? attrs.columns : null,
    },
    content,
  };
}

function convertStatAtom(node: MdxJsxFlowElement): TiptapNode {
  const attrs = extractAttrs(node);
  return {
    type: 'mdxStat',
    attrs: {
      value: typeof attrs.value === 'string' ? attrs.value : null,
      label: typeof attrs.label === 'string' ? attrs.label : null,
      color: typeof attrs.color === 'string' ? attrs.color : null,
    },
  };
}

/** TopicCard's content schema is `mdxTopicLink+`. Same shape as Stats —
 *  drop non-TopicLink children silently and fall back to a single empty
 *  link if the parent serialized empty. */
function convertTopicCard(node: MdxJsxFlowElement): TiptapNode {
  const attrs = extractAttrs(node);
  const content: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    if (
      child.type === 'mdxJsxFlowElement' &&
      (child as MdxJsxFlowElement).name === 'TopicLink'
    ) {
      content.push(convertTopicLinkAtom(child as MdxJsxFlowElement));
    }
  }
  if (content.length === 0) {
    content.push({ type: 'mdxTopicLink', attrs: { label: null, href: null } });
  }
  return {
    type: 'mdxTopicCard',
    attrs: {
      color: typeof attrs.color === 'string' ? attrs.color : null,
      icon: typeof attrs.icon === 'string' ? attrs.icon : null,
      iconLibrary: typeof attrs.iconLibrary === 'string' ? attrs.iconLibrary : null,
      iconType: typeof attrs.iconType === 'string' ? attrs.iconType : null,
      title: typeof attrs.title === 'string' ? attrs.title : null,
      description: typeof attrs.description === 'string' ? attrs.description : null,
      viewAllHref: typeof attrs.viewAllHref === 'string' ? attrs.viewAllHref : null,
    },
    content,
  };
}

/** MediaCard is an atom — no children. Pull every relevant attr off the
 *  JSX element. */
function convertMediaCard(node: MdxJsxFlowElement): TiptapNode {
  const attrs = extractAttrs(node);
  return {
    type: 'mdxMediaCard',
    attrs: {
      image: typeof attrs.image === 'string' ? attrs.image : null,
      imageAlt: typeof attrs.imageAlt === 'string' ? attrs.imageAlt : null,
      title: typeof attrs.title === 'string' ? attrs.title : null,
      description: typeof attrs.description === 'string' ? attrs.description : null,
      href: typeof attrs.href === 'string' ? attrs.href : null,
      category: typeof attrs.category === 'string' ? attrs.category : null,
      categoryColor:
        typeof attrs.categoryColor === 'string' ? attrs.categoryColor : null,
    },
  };
}

function convertTopicLinkAtom(node: MdxJsxFlowElement): TiptapNode {
  const attrs = extractAttrs(node);
  return {
    type: 'mdxTopicLink',
    attrs: {
      label: typeof attrs.label === 'string' ? attrs.label : null,
      href: typeof attrs.href === 'string' ? attrs.href : null,
    },
  };
}

function convertSteps(node: MdxJsxFlowElement, ctx: ConvertCtx): TiptapNode {
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
        const conv = convertBlock(sc as RootContent, ctx);
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

function convertTabs(node: MdxJsxFlowElement, ctx: ConvertCtx): TiptapNode {
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
        const conv = convertBlock(tc as RootContent, ctx);
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

function convertAccordion(node: MdxJsxFlowElement, ctx: ConvertCtx): TiptapNode {
  const attrs = extractAttrs(node);
  const content: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    const conv = convertBlock(child as RootContent, ctx);
    if (conv) content.push(conv);
  }
  if (content.length === 0) content.push({ type: 'paragraph' });
  return { type: 'mdxAccordion', attrs, content };
}

function convertAccordionGroup(
  node: MdxJsxFlowElement,
  ctx: ConvertCtx,
): TiptapNode {
  const items: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    if (
      child.type === 'mdxJsxFlowElement' &&
      (child as MdxJsxFlowElement).name === 'Accordion'
    ) {
      items.push(convertAccordion(child as MdxJsxFlowElement, ctx));
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

function convertColumns(node: MdxJsxFlowElement, ctx: ConvertCtx): TiptapNode {
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
        const conv = convertBlock(cc as RootContent, ctx);
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

function convertCardGroup(node: MdxJsxFlowElement, ctx: ConvertCtx): TiptapNode {
  const attrs = extractAttrs(node);
  const cards: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    if (
      child.type === 'mdxJsxFlowElement' &&
      (child as MdxJsxFlowElement).name === 'Card'
    ) {
      cards.push(convertSimpleBlock(child as MdxJsxFlowElement, ctx, 'mdxCard'));
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
  ctx: ConvertCtx,
): TiptapNode {
  const attrs = extractAttrs(node);
  const content: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    const conv = convertBlock(child as RootContent, ctx);
    if (conv) content.push(conv);
  }
  if (content.length === 0) content.push({ type: 'paragraph' });
  return { type: 'mdxExpandable', attrs, content };
}

function convertTree(node: MdxJsxFlowElement, ctx: ConvertCtx): TiptapNode {
  const items = collectTreeItems(node, ctx.source);
  return { type: 'mdxTree', content: items };
}

function convertGenericBlock(
  node: MdxJsxFlowElement,
  ctx: ConvertCtx,
  type: string,
): TiptapNode {
  const attrs = extractAttrs(node);
  const content: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    const conv = convertBlock(child as RootContent, ctx);
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

function convertCallout(node: MdxJsxFlowElement, ctx: ConvertCtx): TiptapNode {
  const attrs: Record<string, unknown> = {};
  for (const a of node.attributes ?? []) {
    if (a.type === 'mdxJsxAttribute' && typeof a.value === 'string') {
      attrs[a.name] = a.value;
    }
  }
  const variant = calloutVariantFor(node.name ?? 'Callout', attrs);
  const content: TiptapNode[] = [];
  for (const child of node.children ?? []) {
    const conv = convertBlock(child as RootContent, ctx);
    if (conv) content.push(conv);
  }
  if (content.length === 0) content.push({ type: 'paragraph' });
  return {
    type: 'mdxCallout',
    attrs: { variant },
    content,
  };
}

function convertParagraph(node: Paragraph, ctx: ConvertCtx): TiptapNode {
  // Standard markdown image — `![alt](src)` — parses as a paragraph
  // containing a single `image` node. Lift it out of the paragraph and
  // emit a block-level `mdxImage` so it round-trips with the editor's
  // first-class image node. Whitespace-only text siblings are tolerated.
  const imageOnly = paragraphSoleImage(node);
  if (imageOnly) return convertImage(imageOnly);

  const inline = convertInline(node.children);
  if (!inline) return rawBlock(node, ctx.source);
  return { type: 'paragraph', ...(inline.length ? { content: inline } : {}) };
}

function paragraphSoleImage(node: Paragraph): Image | null {
  let image: Image | null = null;
  for (const child of node.children) {
    if (child.type === 'image') {
      if (image) return null;
      image = child;
    } else if (child.type === 'text' && child.value.trim() === '') {
      // ignore whitespace
    } else {
      return null;
    }
  }
  return image;
}

/**
 * GFM table → Tiptap `table` node tree. Mintlify-style: the first row is
 * the header (`tableHeader` cells), subsequent rows are body. Column
 * alignments (`mdast.align[]`) are denormalized onto each cell's `align`
 * attr so the editor's per-cell selection drives the menu's align state.
 */
function convertTable(node: Table, ctx: ConvertCtx): TiptapNode {
  const align = (node.align ?? []) as Array<'left' | 'center' | 'right' | null>;
  const rows = (node.children ?? []) as TableRowNode[];
  const out: TiptapNode[] = [];
  rows.forEach((row, rowIdx) => {
    const cells = (row.children ?? []) as TableCellNode[];
    const cellNodes: TiptapNode[] = [];
    cells.forEach((cell, colIdx) => {
      const inline = convertInline(cell.children as PhrasingContent[]);
      const cellContent: TiptapNode[] = [
        {
          type: 'paragraph',
          ...(inline && inline.length ? { content: inline } : {}),
        },
      ];
      cellNodes.push({
        type: rowIdx === 0 ? 'tableHeader' : 'tableCell',
        attrs: { align: align[colIdx] ?? null },
        content: cellContent,
      });
    });
    out.push({ type: 'tableRow', content: cellNodes });
  });
  // Avoid an empty Tiptap table — the editor refuses to render a table
  // without at least one row containing one cell. If the source is
  // pathological, fall back to an empty 1-cell shell.
  if (out.length === 0) {
    return {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            {
              type: 'tableHeader',
              attrs: { align: null },
              content: [{ type: 'paragraph' }],
            },
          ],
        },
      ],
    };
  }
  void ctx;
  return { type: 'table', content: out };
}

function convertImage(node: Image): TiptapNode {
  return {
    type: 'mdxImage',
    attrs: {
      src: node.url ?? '',
      alt: node.alt ?? '',
      title: node.title ?? null,
    },
  };
}

/**
 * JSX `<img>` element — straight passthrough of standard attrs plus the
 * Mintlify-style `noZoom`. The `srcDark` / `altDark` attrs only appear on
 * the synthesized merged node from `mergeAdjacentLightDarkImgs` (real
 * authored MDX has the variants split across two adjacent `<img>` tags;
 * the pre-pass coalesces them before this runs).
 */
function convertJsxImg(node: MdxJsxFlowElement): TiptapNode {
  const raw = extractAttrs(node);
  const attrs: Record<string, unknown> = {
    src: typeof raw.src === 'string' ? raw.src : '',
    alt: typeof raw.alt === 'string' ? raw.alt : '',
    srcDark: typeof raw.srcDark === 'string' ? raw.srcDark : null,
    altDark: typeof raw.altDark === 'string' ? raw.altDark : null,
    noZoom: raw.noZoom === true,
    title: typeof raw.title === 'string' ? raw.title : null,
    width: numericOrPassthrough(raw.width),
    height: numericOrPassthrough(raw.height),
  };
  return { type: 'mdxImage', attrs };
}

function numericOrPassthrough(v: unknown): number | string | null {
  if (typeof v === 'number') return v;
  if (typeof v === 'string') {
    const n = Number(v);
    return Number.isFinite(n) ? n : v;
  }
  return null;
}

/**
 * Walks every children-bearing node in the mdast tree and merges adjacent
 * `<img>` pairs that follow Mintlify's light/dark visibility convention
 * (className tokens including `dark:hidden` followed by `dark:block`) into
 * a single synthesized `<img>` node carrying both `src` / `alt` and
 * `srcDark` / `altDark` attributes. Mutates the tree in place.
 */
function mergeAdjacentLightDarkImgs(node: { children?: unknown }): void {
  const childrenAny = (node as { children?: unknown[] }).children;
  if (!Array.isArray(childrenAny)) return;
  const children = childrenAny as Array<Record<string, unknown>>;

  for (let i = 0; i < children.length - 1; i++) {
    const a = children[i];
    const b = children[i + 1];
    if (!isImgFlow(a) || !isImgFlow(b)) continue;
    const aClass = readClassName(a as MdxJsxFlowElement);
    const bClass = readClassName(b as MdxJsxFlowElement);
    if (!aClass.includes('dark:hidden') || !bClass.includes('dark:block')) continue;

    const merged = mergeImgPair(a as MdxJsxFlowElement, b as MdxJsxFlowElement);
    children.splice(i, 2, merged as unknown as Record<string, unknown>);
    // Don't decrement i — the merged node at i is already an img we don't
    // want to re-pair, so move past it.
  }
  // Recurse into surviving children.
  for (const child of children) mergeAdjacentLightDarkImgs(child);
}

function isImgFlow(n: unknown): n is MdxJsxFlowElement {
  if (!n || typeof n !== 'object') return false;
  const obj = n as Record<string, unknown>;
  return obj.type === 'mdxJsxFlowElement' && obj.name === 'img';
}

function readClassName(node: MdxJsxFlowElement): string {
  for (const a of node.attributes ?? []) {
    if (a.type !== 'mdxJsxAttribute') continue;
    if (a.name !== 'className' && a.name !== 'class') continue;
    const v = a.value;
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object' && 'value' in v && typeof v.value === 'string') {
      // Strip surrounding quotes from a JSX expression like {"hidden dark:block"}.
      return v.value.replace(/^["']|["']$/g, '');
    }
  }
  return '';
}

function mergeImgPair(
  light: MdxJsxFlowElement,
  dark: MdxJsxFlowElement,
): MdxJsxFlowElement {
  const lightAttrs = extractAttrs(light);
  const darkAttrs = extractAttrs(dark);
  const merged: MdxJsxFlowElement = {
    type: 'mdxJsxFlowElement',
    name: 'img',
    attributes: [],
    children: [],
  };
  const set = (name: string, value: string | boolean) => {
    merged.attributes.push({
      type: 'mdxJsxAttribute',
      name,
      value: typeof value === 'boolean' ? null : value,
    });
  };
  if (typeof lightAttrs.src === 'string') set('src', lightAttrs.src);
  if (typeof lightAttrs.alt === 'string') set('alt', lightAttrs.alt);
  if (typeof darkAttrs.src === 'string') set('srcDark', darkAttrs.src);
  if (typeof darkAttrs.alt === 'string') set('altDark', darkAttrs.alt);
  if (lightAttrs.noZoom === true || darkAttrs.noZoom === true) set('noZoom', true);
  if (typeof lightAttrs.width === 'string') set('width', lightAttrs.width);
  if (typeof lightAttrs.height === 'string') set('height', lightAttrs.height);
  return merged;
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

function convertList(node: List, ctx: ConvertCtx): TiptapNode {
  const items: TiptapNode[] = [];
  for (const child of node.children) {
    items.push(convertListItem(child, ctx));
  }
  const attrs: Record<string, unknown> = {};
  if (node.ordered && node.start != null) attrs.start = node.start;
  return {
    type: node.ordered ? 'orderedList' : 'bulletList',
    ...(Object.keys(attrs).length ? { attrs } : {}),
    content: items,
  };
}

function convertListItem(node: ListItem, ctx: ConvertCtx): TiptapNode {
  const content: TiptapNode[] = [];
  for (const child of node.children) {
    const conv = convertBlock(child as RootContent, ctx);
    if (conv) content.push(conv);
  }
  if (content.length === 0) content.push({ type: 'paragraph' });
  return { type: 'listItem', content };
}

function convertBlockquote(node: Blockquote, ctx: ConvertCtx): TiptapNode {
  const content: TiptapNode[] = [];
  for (const child of node.children) {
    const conv = convertBlock(child as RootContent, ctx);
    if (conv) content.push(conv);
  }
  if (content.length === 0) content.push({ type: 'paragraph' });
  return { type: 'blockquote', content };
}

function convertCode(node: Code): TiptapNode {
  const text = node.value ?? '';
  const meta = parseCodeMeta(node.meta);
  return {
    type: 'codeBlock',
    attrs: {
      language: node.lang ?? null,
      filename: meta.filename ?? null,
      showLineNumbers: meta.showLineNumbers,
      wrapCode: meta.wrapCode,
    },
    ...(text ? { content: [{ type: 'text', text }] } : {}),
  };
}

interface CodeMeta {
  filename?: string;
  showLineNumbers: boolean;
  wrapCode: boolean;
}

/**
 * Fence-meta tokens we recognise (after the language):
 *   - First non-`key=value` token that isn't a reserved flag → filename
 *   - `lines`  → show line-number gutter
 *   - `wrap`   → soft-wrap long lines
 *
 * Other `key=value` tokens (Mintlify-style highlights, tooling hints) pass
 * through unread; they round-trip via the underlying meta string only when
 * we re-emit them, which we don't yet — flag-only support is enough for the
 * editor's configurable controls.
 */
function parseCodeMeta(meta: string | null | undefined): CodeMeta {
  const result: CodeMeta = { showLineNumbers: false, wrapCode: false };
  if (!meta) return result;
  for (const token of meta.trim().split(/\s+/)) {
    if (!token) continue;
    if (/^[A-Za-z_][A-Za-z0-9_-]*=/.test(token)) continue;
    if (token === 'lines') { result.showLineNumbers = true; continue; }
    if (token === 'wrap') { result.wrapCode = true; continue; }
    if (!result.filename) result.filename = token;
  }
  return result;
}

function convertImportedSnippet(
  node: MdxJsxFlowElement,
  spec: ImportSpec,
): TiptapNode {
  const jsxAttrs = extractAttrs(node);
  const isReact = /\.(jsx|tsx)$/i.test(spec.path);
  return {
    type: 'mdxImportedSnippet',
    attrs: {
      binding: spec.binding,
      path: spec.path,
      jsxAttrs,
      isReact,
    },
  };
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
      if (jsx.name === 'Tooltip') return [convertInlineTooltip(jsx)];
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

function convertInlineTooltip(node: MdxJsxTextElement): TiptapNode {
  const attrs: Record<string, unknown> = {};
  for (const a of node.attributes ?? []) {
    if (a.type !== 'mdxJsxAttribute') continue;
    if (typeof a.value === 'string') attrs[a.name] = a.value;
    else if (a.value === null) attrs[a.name] = true;
  }
  let text = '';
  for (const child of node.children ?? []) {
    if (child.type === 'text') text += child.value;
  }
  return {
    type: 'mdxTooltip',
    attrs: { ...attrs, text: text.trim() },
  };
}

function convertStandaloneInlineTooltip(node: MdxJsxFlowElement): TiptapNode {
  const attrs: Record<string, unknown> = {};
  for (const a of node.attributes ?? []) {
    if (a.type !== 'mdxJsxAttribute') continue;
    if (typeof a.value === 'string') attrs[a.name] = a.value;
    else if (a.value === null) attrs[a.name] = true;
  }
  let text = '';
  for (const child of node.children ?? []) {
    if (child.type === 'paragraph') {
      for (const inline of child.children ?? []) {
        if (inline.type === 'text') text += inline.value;
      }
    }
  }
  return {
    type: 'mdxTooltip',
    attrs: { ...attrs, text: text.trim() },
  };
}

function convertHero(node: MdxJsxFlowElement): TiptapNode {
  const raw = extractAttrs(node);
  const str = (key: string, src: Record<string, unknown> = raw): string | undefined => {
    const v = src[key];
    return typeof v === 'string' ? v : undefined;
  };
  const num = (key: string, src: Record<string, unknown> = raw): number | null => {
    const v = src[key];
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  };
  // Variant must be one of the known values; anything else falls back to
  // banner so the editor preview doesn't crash on a typo.
  const rawVariant = str('variant');
  const variant =
    rawVariant === 'banner' || rawVariant === 'compact' || rawVariant === 'split'
      ? rawVariant
      : null;

  // Two authoring forms collapse to the same internal shape:
  //   1. shorthand    `<Hero title="..." description="..." />`
  //   2. multi-slide  `<Hero slides={[{ title: "..." }, ...]} />`
  // When both forms are present, the explicit `slides` array wins; the
  // top-level fields are dropped so the editor doesn't have two competing
  // sources of truth.
  const slidesAttr = raw.slides;
  let slides: HeroSlideShape[];
  if (Array.isArray(slidesAttr)) {
    slides = slidesAttr.map(coerceSlide);
  } else {
    slides = [coerceSlide(raw)];
  }
  if (slides.length === 0) slides = [{}];

  return {
    type: 'mdxHero',
    attrs: {
      variant,
      interval: num('interval'),
      padded: typeof raw.padded === 'boolean' ? raw.padded : null,
      slides,
    },
  };
}

interface HeroSlideShape {
  eyebrow?: string;
  title?: string;
  accent?: string;
  description?: string;
  actions?: Array<{ label: string; href: string; style?: 'primary' | 'secondary' }>;
  background?: string;
  textColor?: string;
  titleColor?: string;
  accentColor?: string;
  secondaryTitle?: string;
  secondaryDescription?: string;
  sideImage?: string;
  sideImageAlt?: string;
}

function coerceSlide(raw: unknown): HeroSlideShape {
  if (!raw || typeof raw !== 'object') return {};
  const r = raw as Record<string, unknown>;
  const out: HeroSlideShape = {};
  const strFields = [
    'eyebrow',
    'title',
    'accent',
    'description',
    'background',
    'textColor',
    'titleColor',
    'accentColor',
    'secondaryTitle',
    'secondaryDescription',
    'sideImage',
    'sideImageAlt',
  ] as const;
  for (const k of strFields) {
    const v = r[k];
    if (typeof v === 'string') out[k] = v;
  }
  if (Array.isArray(r.actions)) {
    const acts: HeroSlideShape['actions'] = [];
    for (const a of r.actions) {
      if (!a || typeof a !== 'object') continue;
      const o = a as Record<string, unknown>;
      const label = typeof o.label === 'string' ? o.label : '';
      const href = typeof o.href === 'string' ? o.href : '';
      const style =
        o.style === 'primary' || o.style === 'secondary' ? o.style : undefined;
      acts.push({ label, href, ...(style ? { style } : {}) });
    }
    if (acts.length > 0) out.actions = acts;
  }
  return out;
}

function convertProfile(node: MdxJsxFlowElement): TiptapNode {
  const raw = extractAttrs(node);
  const str = (key: string): string | null =>
    typeof raw[key] === 'string' ? (raw[key] as string) : null;
  return {
    type: 'mdxProfile',
    attrs: {
      name: str('name') ?? 'New profile',
      title: str('title'),
      photo: str('photo'),
      href: str('href'),
      initials: str('initials'),
      accent: str('accent'),
    },
  };
}

function convertVideo(node: MdxJsxFlowElement): TiptapNode {
  const raw = extractAttrs(node);
  const src = typeof raw.src === 'string' ? raw.src : '';
  const caption = typeof raw.caption === 'string' ? raw.caption : null;
  // `extractAttrs` resolves `<Video loop />` (presence) to true and `loop={true}`
  // (JSX expression) to true via JSON.parse. The string form `loop="true"` is
  // historical but cheap to keep accepting.
  const loop =
    raw.loop === true || raw.loop === 'true' ? true : false;
  const maxLoops =
    typeof raw.maxLoops === 'number' && Number.isFinite(raw.maxLoops)
      ? raw.maxLoops
      : null;
  return {
    type: 'mdxVideo',
    attrs: { src, caption, loop, maxLoops },
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
