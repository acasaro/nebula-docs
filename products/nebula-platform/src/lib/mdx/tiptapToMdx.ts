import {
  groupImportsByPath,
  serializeImports,
  type ImportSpec,
} from '@nebula-docs/mdx';
import type { TiptapDoc, TiptapMark, TiptapNode } from './mdastToTiptap';

const MARK_INNER_TO_OUTER = ['code', 'strike', 'italic', 'bold'];

/**
 * Serialize the editor doc back to MDX body source. Optionally accepts the
 * imports the editor parsed at load time — preserved verbatim and
 * prepended at the top of the output so round-trip is byte-clean (open
 * file → no edit → unchanged source) even when the user has hand-authored
 * imports (e.g. for variables, named exports, or React component
 * snippets) whose bindings don't appear as `mdxImportedSnippet` nodes.
 *
 * Imports added via the `/snippet` slash command stay in the file even
 * after the user deletes the snippet's JSX node — the unused import is a
 * cosmetic-only no-op at build time, and stripping them would risk
 * deleting a variable import the editor doesn't model yet (`import { foo }
 * from "/snippets/lib.mdx"` → `{foo}` body interpolation).
 */
export function tiptapDocToMdx(
  doc: TiptapDoc,
  imports: readonly ImportSpec[] = [],
): string {
  // Drop trailing empty paragraphs. ProseMirror auto-inserts one on focus
  // when the doc ends with an atom; without this strip, focus + undo would
  // leave the draft serializing differently than its load state and falsely
  // mark the file dirty.
  const content = doc.content ?? [];
  let end = content.length;
  while (end > 0) {
    const last = content[end - 1];
    if (last?.type === 'paragraph' && !(last.content?.length ?? 0)) {
      end--;
    } else {
      break;
    }
  }
  const blocks = content.slice(0, end).map(serializeBlock).filter((b) => b !== null);
  const body = blocks.join('\n\n') + '\n';

  if (imports.length === 0) return body;
  const importBlock = serializeImports(imports);
  return `${importBlock}\n\n${body}`;
}

// `groupImportsByPath` is re-exported as a convenience so MdxEditor can
// dedupe before passing to the serializer if needed.
export { groupImportsByPath };

function serializeBlock(node: TiptapNode): string {
  switch (node.type) {
    case 'paragraph':
      return serializeInline(node.content);
    case 'heading':
      return (
        '#'.repeat((node.attrs?.level as number | undefined) ?? 1) +
        ' ' +
        serializeInline(node.content)
      );
    case 'bulletList':
      return (node.content ?? [])
        .map((item) => serializeListItem(item, '- '))
        .join('\n');
    case 'orderedList': {
      const start = (node.attrs?.start as number | undefined) ?? 1;
      return (node.content ?? [])
        .map((item, i) => serializeListItem(item, `${start + i}. `))
        .join('\n');
    }
    case 'blockquote':
      return (node.content ?? [])
        .map(serializeBlock)
        .filter(Boolean)
        .join('\n\n')
        .split('\n')
        .map((line) => (line.length ? '> ' + line : '>'))
        .join('\n');
    case 'codeBlock': {
      const lang = (node.attrs?.language as string | null | undefined) ?? '';
      const filename = (node.attrs?.filename as string | null | undefined) ?? '';
      const showLineNumbers = !!node.attrs?.showLineNumbers;
      const wrapCode = !!node.attrs?.wrapCode;
      const text = (node.content ?? []).map((c) => c.text ?? '').join('');
      const tokens: string[] = [];
      if (filename) tokens.push(filename);
      if (showLineNumbers) tokens.push('lines');
      if (wrapCode) tokens.push('wrap');
      const meta = tokens.length ? ' ' + tokens.join(' ') : '';
      return '```' + lang + meta + '\n' + text + '\n```';
    }
    case 'horizontalRule':
      return '---';
    case 'mdxRaw':
      return ((node.attrs?.source as string | undefined) ?? '').replace(/\n+$/, '');
    case 'mdxCallout':
      return serializeCallout(node);
    case 'mdxCard':
      return serializeJsxBlock(node, 'Card');
    case 'mdxFrame':
      return serializeJsxBlock(node, 'Frame');
    case 'mdxSheet':
      return serializeJsxBlock(node, 'Sheet');
    case 'mdxUpdate':
      return serializeJsxBlock(node, 'Update');
    case 'mdxSteps':
      return serializeSteps(node);
    case 'mdxStep':
      return serializeJsxBlock(node, 'Step');
    case 'mdxTabs':
      return serializeTabs(node);
    case 'mdxTab':
      return serializeJsxBlock(node, 'Tab');
    case 'mdxAccordion':
      return serializeJsxBlock(node, 'Accordion');
    case 'mdxAccordionGroup':
      return serializeAccordionGroup(node);
    case 'mdxColumns':
      return serializeColumns(node);
    case 'mdxColumn':
      return serializeJsxBlock(node, 'Column');
    case 'mdxCardGroup':
      return serializeCardGroup(node);
    case 'mdxExpandable':
      return serializeJsxBlock(node, 'Expandable');
    case 'mdxTree':
      return serializeTree(node);
    case 'mdxTreeFolder':
      return serializeTreeFolder(node);
    case 'mdxTreeFile':
      return serializeTreeFile(node);
    case 'mdxParamField':
      return serializeJsxBlock(node, 'ParamField');
    case 'mdxResponseField':
      return serializeJsxBlock(node, 'ResponseField');
    case 'mdxRequestExample':
      return serializeJsxBlock(node, 'RequestExample');
    case 'mdxResponseExample':
      return serializeJsxBlock(node, 'ResponseExample');
    case 'mdxMermaid':
      return serializeMermaid(node);
    case 'mdxCodeGroup':
      return serializeCodeGroup(node);
    case 'mdxImage':
      return serializeImage(node);
    case 'mdxVideo':
      return serializeVideo(node);
    case 'mdxProfile':
      return serializeProfile(node);
    case 'mdxHero':
      return serializeHero(node);
    case 'table':
      return serializeTable(node);
    case 'mdxImportedSnippet':
      return serializeImportedSnippet(node);
    case 'hardBreak':
      return '  \n';
    default:
      return '';
  }
}

/**
 * Tiptap `table` → GFM markdown. The first row of the Tiptap node is the
 * header row (its cells are `tableHeader`); subsequent rows are body
 * (`tableCell`). Column alignment lives per-cell as the `align` attr; we
 * read it from the header row to build the `| --- |` separator. Cells with
 * different `align` values in the same column win-by-header (matches what
 * GFM can express — alignment is column-scoped, not cell-scoped).
 */
function serializeTable(node: TiptapNode): string {
  const rows = node.content ?? [];
  if (rows.length === 0) return '';

  // Determine the column count from the widest row so a malformed table
  // (rows with mismatched cell counts) still serializes to valid GFM.
  const colCount = rows.reduce((max, row) => {
    const n = (row.content ?? []).length;
    return n > max ? n : max;
  }, 0);
  if (colCount === 0) return '';

  const headerRow = rows[0];
  const bodyRows = rows.slice(1);
  const align: Array<'left' | 'center' | 'right' | null> = [];
  for (let i = 0; i < colCount; i++) {
    const cell = headerRow.content?.[i];
    const a = cell?.attrs?.align;
    align.push(
      a === 'left' || a === 'center' || a === 'right' ? a : null,
    );
  }

  const renderRow = (row: TiptapNode): string => {
    const cells = row.content ?? [];
    const parts: string[] = [];
    for (let i = 0; i < colCount; i++) {
      const cell = cells[i];
      const text = cell ? serializeCellInline(cell) : '';
      parts.push(text);
    }
    return `| ${parts.join(' | ')} |`;
  };

  const separator = `| ${align
    .map((a) => {
      if (a === 'center') return ':---:';
      if (a === 'right') return '---:';
      if (a === 'left') return ':---';
      return '---';
    })
    .join(' | ')} |`;

  const lines = [renderRow(headerRow), separator, ...bodyRows.map(renderRow)];
  return lines.join('\n');
}

/**
 * A table cell holds a single paragraph in our model. Pull its inline
 * content out to a single line and escape the GFM pipe character so a
 * cell containing `a|b` doesn't break the row.
 */
function serializeCellInline(cell: TiptapNode): string {
  const para = cell.content?.[0];
  if (!para || para.type !== 'paragraph') return '';
  const inline = serializeInline(para.content);
  // Replace literal newlines with a `<br>` (the GFM convention for
  // multi-line cell content) and escape pipes.
  return inline.replace(/\n+/g, '<br>').replace(/\|/g, '\\|');
}

function serializeImage(node: TiptapNode): string {
  const a = (node.attrs ?? {}) as {
    src?: string;
    alt?: string;
    srcDark?: string | null;
    altDark?: string | null;
    noZoom?: boolean;
    title?: string | null;
    width?: number | string | null;
    height?: number | string | null;
  };
  const src = String(a.src ?? '');
  const alt = String(a.alt ?? '');
  const srcDark = a.srcDark ?? null;
  const altDark = a.altDark ?? null;
  const noZoom = a.noZoom === true;
  const width = a.width ?? null;
  const height = a.height ?? null;

  // Two-tag Mintlify pattern when a dark variant is set. The light tag is
  // visible by default and hidden in dark mode; the dark tag is the inverse.
  if (srcDark) {
    const lightAttrs: ImgAttrs = {
      src,
      alt,
      className: 'block dark:hidden',
      noZoom,
      width,
      height,
    };
    const darkAttrs: ImgAttrs = {
      src: srcDark,
      alt: altDark ?? alt,
      className: 'hidden dark:block',
      noZoom,
      width,
      height,
    };
    return `${jsxImg(lightAttrs)}\n${jsxImg(darkAttrs)}`;
  }

  // Single JSX tag when there's a non-default attribute that markdown
  // shorthand can't carry (noZoom, explicit dimensions).
  if (noZoom || width != null || height != null) {
    return jsxImg({ src, alt, noZoom, width, height });
  }

  // Default: markdown shorthand. Escape `]` and `)` per CommonMark.
  const safeAlt = alt.replace(/[\\\]]/g, (m) => `\\${m}`);
  const safeUrl = src.replace(/[\\)]/g, (m) => `\\${m}`);
  const titlePart =
    typeof a.title === 'string' && a.title.length > 0
      ? ` "${a.title.replace(/"/g, '\\"')}"`
      : '';
  return `![${safeAlt}](${safeUrl}${titlePart})`;
}

interface ImgAttrs {
  src: string;
  alt: string;
  className?: string;
  noZoom?: boolean;
  width?: number | string | null;
  height?: number | string | null;
}

function serializeHero(node: TiptapNode): string {
  // Editor model is always `slides[]`. Source emission flips between two
  // shapes for readability:
  //   - 1 slide  → shorthand top-level attrs (`<Hero title="..." />`)
  //   - 2+ slides → explicit `slides={[...]}` JSX expression
  const a = (node.attrs ?? {}) as {
    variant?: string | null;
    interval?: number | null;
    padded?: boolean | null;
    slides?: Array<Record<string, unknown>> | null;
  };
  const slides = Array.isArray(a.slides) && a.slides.length > 0 ? a.slides : [{}];
  const top: Record<string, unknown> = {};
  if (a.variant) top.variant = a.variant;
  if (typeof a.interval === 'number' && Number.isFinite(a.interval)) {
    top.interval = a.interval;
  }
  if (a.padded === false) top.padded = false;

  if (slides.length === 1) {
    const slide = pruneSlide(slides[0] ?? {});
    Object.assign(top, slide);
    return `<Hero${serializeAttrs(top)} />`;
  }

  // Multi-slide: emit slides as a JSON-compatible JS array literal so the
  // round-trip parser (which uses JSON.parse on JSX expressions) can read
  // it back without an eval fallback.
  const slidesPruned = slides.map((s) => pruneSlide(s ?? {}));
  top.slides = { __expression: JSON.stringify(slidesPruned, null, 2) };
  return `<Hero${serializeAttrs(top)} />`;
}

function pruneSlide(slide: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(slide)) {
    if (v == null) continue;
    if (typeof v === 'string' && v.length === 0) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

function serializeProfile(node: TiptapNode): string {
  const a = (node.attrs ?? {}) as {
    name?: string;
    title?: string | null;
    photo?: string | null;
    href?: string | null;
    initials?: string | null;
    accent?: string | null;
  };
  const parts: string[] = [];
  parts.push(`name="${escapeJsxAttr(String(a.name ?? ''))}"`);
  if (typeof a.title === 'string' && a.title.length > 0) {
    parts.push(`title="${escapeJsxAttr(a.title)}"`);
  }
  if (typeof a.photo === 'string' && a.photo.length > 0) {
    parts.push(`photo="${escapeJsxAttr(a.photo)}"`);
  }
  if (typeof a.href === 'string' && a.href.length > 0) {
    parts.push(`href="${escapeJsxAttr(a.href)}"`);
  }
  if (typeof a.initials === 'string' && a.initials.length > 0) {
    parts.push(`initials="${escapeJsxAttr(a.initials)}"`);
  }
  if (typeof a.accent === 'string' && a.accent.length > 0) {
    parts.push(`accent="${escapeJsxAttr(a.accent)}"`);
  }
  return `<Profile ${parts.join(' ')} />`;
}

function serializeVideo(node: TiptapNode): string {
  const a = (node.attrs ?? {}) as {
    src?: string;
    caption?: string | null;
    loop?: boolean;
    maxLoops?: number | null;
  };
  const parts: string[] = [];
  parts.push(`src="${escapeJsxAttr(String(a.src ?? ''))}"`);
  if (typeof a.caption === 'string' && a.caption.length > 0) {
    parts.push(`caption="${escapeJsxAttr(a.caption)}"`);
  }
  if (a.loop === true) parts.push('loop');
  if (typeof a.maxLoops === 'number' && Number.isFinite(a.maxLoops)) {
    parts.push(`maxLoops={${a.maxLoops}}`);
  }
  return `<Video ${parts.join(' ')} />`;
}

function jsxImg(a: ImgAttrs): string {
  const parts: string[] = [];
  parts.push(`src="${escapeJsxAttr(a.src)}"`);
  parts.push(`alt="${escapeJsxAttr(a.alt)}"`);
  if (a.className) parts.push(`className="${a.className}"`);
  if (a.noZoom) parts.push('noZoom');
  if (a.width != null) parts.push(`width="${escapeJsxAttr(String(a.width))}"`);
  if (a.height != null) parts.push(`height="${escapeJsxAttr(String(a.height))}"`);
  return `<img ${parts.join(' ')} />`;
}

function escapeJsxAttr(s: string): string {
  // JSX double-quoted attribute values: encode embedded quotes as &quot;.
  return s.replace(/"/g, '&quot;');
}

const PRESET_VARIANTS = new Set([
  'note',
  'tip',
  'info',
  'check',
  'warning',
  'danger',
]);

function serializeAttrs(attrs: Record<string, unknown> | undefined): string {
  if (!attrs) return '';
  const parts: string[] = [];
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (v === true) {
      parts.push(k);
    } else if (typeof v === 'string') {
      // JSX attribute values are NOT JS string literals — backslash escapes
      // (`\"`) aren't honored by the MDX parser. Embedded double quotes have
      // to be HTML-entity-encoded so the value survives a round trip.
      parts.push(`${k}="${escapeJsxAttr(v)}"`);
    } else if (
      typeof v === 'object' &&
      v !== null &&
      '__expression' in v &&
      typeof (v as { __expression: unknown }).__expression === 'string'
    ) {
      parts.push(`${k}={${(v as { __expression: string }).__expression}}`);
    } else {
      parts.push(`${k}={${JSON.stringify(v)}}`);
    }
  }
  return parts.length ? ' ' + parts.join(' ') : '';
}

function serializeJsxBlock(node: TiptapNode, tag: string): string {
  const attrs = serializeAttrs(node.attrs);
  const body = (node.content ?? [])
    .map(serializeBlock)
    .filter(Boolean)
    .join('\n\n');
  return `<${tag}${attrs}>\n${body}\n</${tag}>`;
}

function serializeSteps(node: TiptapNode): string {
  const attrs = serializeAttrs(node.attrs);
  const stepBlocks = (node.content ?? [])
    .map((child) =>
      child.type === 'mdxStep' ? serializeJsxBlock(child, 'Step') : '',
    )
    .filter(Boolean)
    .join('\n\n');
  return `<Steps${attrs}>\n${stepBlocks}\n</Steps>`;
}

function serializeImportedSnippet(node: TiptapNode): string {
  const binding = (node.attrs?.binding as string | undefined) ?? '';
  const jsxAttrs =
    (node.attrs?.jsxAttrs as Record<string, unknown> | undefined) ?? {};
  if (!binding) return '';
  const attrStr = serializeAttrs(jsxAttrs);
  // Always self-close. The NodeView renders the resolved snippet body
  // read-only; the source on disk stays the JSX call site + the import
  // declaration that `tiptapDocToMdx` re-emits at the top of the file.
  return `<${binding}${attrStr} />`;
}

function serializeCodeGroup(node: TiptapNode): string {
  const attrs = serializeAttrs(node.attrs);
  const body = (node.content ?? [])
    .filter((child) => child.type === 'codeBlock')
    .map((child) => serializeBlock(child))
    .filter(Boolean)
    .join('\n\n');
  return `<CodeGroup${attrs}>\n${body}\n</CodeGroup>`;
}

function serializeMermaid(node: TiptapNode): string {
  const chart = (node.attrs?.chart as string | undefined) ?? '';
  // JSON.stringify gives us a quoted string with escaped newlines and quotes.
  // Wrapping it in `{ ... }` makes it a JSX expression, which `mdx-js` parses
  // back as the original string.
  return `<Mermaid chart={${JSON.stringify(chart)}} />`;
}

function serializeTree(node: TiptapNode): string {
  const body = (node.content ?? [])
    .map((child) => {
      if (child.type === 'mdxTreeFolder') return serializeTreeFolder(child);
      if (child.type === 'mdxTreeFile') return serializeTreeFile(child);
      return '';
    })
    .filter(Boolean)
    .join('\n');
  return `<Tree>\n${body}\n</Tree>`;
}

function serializeTreeFolder(node: TiptapNode): string {
  const attrs = serializeAttrs(node.attrs);
  const body = (node.content ?? [])
    .map((child) => {
      if (child.type === 'mdxTreeFolder') return serializeTreeFolder(child);
      if (child.type === 'mdxTreeFile') return serializeTreeFile(child);
      return '';
    })
    .filter(Boolean)
    .join('\n');
  if (body) return `<Tree.Folder${attrs}>\n${body}\n</Tree.Folder>`;
  return `<Tree.Folder${attrs} />`;
}

function serializeTreeFile(node: TiptapNode): string {
  const attrs = serializeAttrs(node.attrs);
  return `<Tree.File${attrs} />`;
}

function serializeColumns(node: TiptapNode): string {
  const attrs = serializeAttrs(node.attrs);
  const body = (node.content ?? [])
    .map((child) =>
      child.type === 'mdxColumn' ? serializeJsxBlock(child, 'Column') : '',
    )
    .filter(Boolean)
    .join('\n\n');
  return `<Columns${attrs}>\n${body}\n</Columns>`;
}

function serializeCardGroup(node: TiptapNode): string {
  const attrs = serializeAttrs(node.attrs);
  const body = (node.content ?? [])
    .map((child) =>
      child.type === 'mdxCard' ? serializeJsxBlock(child, 'Card') : '',
    )
    .filter(Boolean)
    .join('\n\n');
  return `<CardGroup${attrs}>\n${body}\n</CardGroup>`;
}

function serializeAccordionGroup(node: TiptapNode): string {
  const body = (node.content ?? [])
    .map((child) =>
      child.type === 'mdxAccordion' ? serializeJsxBlock(child, 'Accordion') : '',
    )
    .filter(Boolean)
    .join('\n\n');
  return `<AccordionGroup>\n${body}\n</AccordionGroup>`;
}

function serializeTabs(node: TiptapNode): string {
  const attrs = serializeAttrs(node.attrs);
  const tabBlocks = (node.content ?? [])
    .map((child) =>
      child.type === 'mdxTab' ? serializeJsxBlock(child, 'Tab') : '',
    )
    .filter(Boolean)
    .join('\n\n');
  return `<Tabs${attrs}>\n${tabBlocks}\n</Tabs>`;
}

function serializeCallout(node: TiptapNode): string {
  const variant = (node.attrs?.variant as string | undefined) ?? 'note';
  const body = (node.content ?? [])
    .map(serializeBlock)
    .filter(Boolean)
    .join('\n\n');
  if (PRESET_VARIANTS.has(variant)) {
    const tag = variant.charAt(0).toUpperCase() + variant.slice(1);
    return `<${tag}>\n${body}\n</${tag}>`;
  }
  return `<Callout type="${variant}">\n${body}\n</Callout>`;
}

function serializeListItem(item: TiptapNode, prefix: string): string {
  const blocks = (item.content ?? []).map(serializeBlock).filter(Boolean);
  if (blocks.length === 0) return prefix.trimEnd();
  const [first, ...rest] = blocks;
  const indent = ' '.repeat(prefix.length);
  const tail = rest
    .map((b) => b.split('\n').map((l) => indent + l).join('\n'))
    .join('\n\n');
  return prefix + first + (tail ? '\n\n' + tail : '');
}

function serializeInline(content?: TiptapNode[]): string {
  if (!content) return '';
  return content.map(serializeInlineNode).join('');
}

function serializeInlineNode(node: TiptapNode): string {
  if (node.type === 'hardBreak') return '  \n';
  if (node.type === 'mdxBadge') return serializeBadge(node);
  if (node.type === 'mdxTooltip') return serializeTooltip(node);
  if (node.type !== 'text') return '';
  let text = node.text ?? '';
  const marks = sortMarks(node.marks ?? []);
  for (const mark of marks) {
    text = applyMark(text, mark);
  }
  return text;
}

function serializeBadge(node: TiptapNode): string {
  const { label, ...rest } = (node.attrs ?? {}) as Record<string, unknown> & {
    label?: string;
  };
  const attrStr = serializeAttrs(rest);
  const text = (label ?? '').trim();
  return `<Badge${attrStr}>${text}</Badge>`;
}

function serializeTooltip(node: TiptapNode): string {
  const { text, side, align, ...rest } = (node.attrs ?? {}) as Record<string, unknown> & {
    text?: string;
  };
  const passthrough: Record<string, unknown> = { ...rest };
  if (side && side !== 'top') passthrough.side = side;
  if (align && align !== 'center') passthrough.align = align;
  const attrStr = serializeAttrs(passthrough);
  const inner = (text ?? '').trim();
  return `<Tooltip${attrStr}>${inner}</Tooltip>`;
}

function sortMarks(marks: TiptapMark[]): TiptapMark[] {
  return [...marks].sort((a, b) => {
    const ai = MARK_INNER_TO_OUTER.indexOf(a.type);
    const bi = MARK_INNER_TO_OUTER.indexOf(b.type);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });
}

function applyMark(text: string, mark: TiptapMark): string {
  switch (mark.type) {
    case 'bold':
      return `**${text}**`;
    case 'italic':
      return `*${text}*`;
    case 'code':
      return `\`${text}\``;
    case 'strike':
      return `~~${text}~~`;
    default:
      return text;
  }
}
