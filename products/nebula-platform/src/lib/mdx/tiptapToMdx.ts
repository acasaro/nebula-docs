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
      const text = (node.content ?? []).map((c) => c.text ?? '').join('');
      const meta = filename ? ` ${filename}` : '';
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
    case 'mdxImportedSnippet':
      return serializeImportedSnippet(node);
    case 'hardBreak':
      return '  \n';
    default:
      return '';
  }
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
      parts.push(`${k}="${v.replace(/"/g, '\\"')}"`);
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
