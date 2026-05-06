import type { Paragraph, PhrasingContent, Root, RootContent } from 'mdast';
import type {
  MdxJsxAttribute,
  MdxJsxFlowElement,
  MdxJsxTextElement,
} from 'mdast-util-mdx';
import { visit } from 'unist-util-visit';
import { parseMdx } from './parse';

/**
 * Resolves a snippet path (the value of `<Snippet file="..." />`) to its raw
 * MDX content. Implementations vary by consumer:
 *
 *  - CLI / build-time → reads from `content/snippets/<path>.mdx` on disk
 *  - Platform / editor-time → reads from the in-memory files map populated
 *    by Octokit when the user enters the editor
 *
 * Returning `undefined` for an unknown path leaves the `<Snippet>` JSX in
 * place untouched (caller decides whether to warn or fail).
 */
export type ResolveFile = (path: string) => string | undefined;

export interface RemarkSnippetsOptions {
  /** Reader for snippet content. See {@link ResolveFile}. */
  resolveFile: ResolveFile;
}

interface FlowReplacement {
  kind: 'flow';
  index: number;
  parent: { children: RootContent[] };
  replacement: RootContent[];
}

interface InlineReplacement {
  kind: 'inline';
  index: number;
  parent: { children: PhrasingContent[] };
  replacement: PhrasingContent[];
}

type Replacement = FlowReplacement | InlineReplacement;

/**
 * unified plugin that walks the MDAST and replaces `<Snippet file="..." />`
 * JSX elements with the parsed content of the referenced snippet file.
 *
 * Resolves at both build-time (CLI) and editor-time (Platform) so the editor
 * can render snippets inline without requiring a preview build.
 *
 * Both block (`mdxJsxFlowElement`) and inline (`mdxJsxTextElement`) `<Snippet>`
 * forms are handled. Inline snippets are rare — if the resolved content isn't
 * a single paragraph, the inline JSX is left in place untouched (consumer
 * decides how to render the unresolved element).
 *
 * Limitations:
 *  - Nested snippets (a snippet that itself contains `<Snippet>`) are not
 *    resolved recursively. Add a second pass if needed; deferred until a
 *    real use case arrives.
 *  - The `resolveFile` callback is synchronous. Async loading is the
 *    consumer's job (e.g., Platform pre-fetches all `content/snippets/*.mdx`
 *    when entering the editor, then resolves synchronously here).
 */
export function remarkSnippets(options: RemarkSnippetsOptions) {
  const { resolveFile } = options;
  return function transformer(tree: Root): void {
    const replacements: Replacement[] = [];

    visit(tree, 'mdxJsxFlowElement', (node: MdxJsxFlowElement, index, parent) => {
      if (node.name !== 'Snippet') return;
      if (typeof index !== 'number' || !parent || !('children' in parent)) return;

      const file = readFileAttr(node);
      if (!file) return;

      const content = resolveFile(file);
      if (content === undefined) return;

      const subtree = parseMdx(content);
      replacements.push({
        kind: 'flow',
        index,
        parent: parent as { children: RootContent[] },
        replacement: subtree.children,
      });
    });

    visit(tree, 'mdxJsxTextElement', (node: MdxJsxTextElement, index, parent) => {
      if (node.name !== 'Snippet') return;
      if (typeof index !== 'number' || !parent || !('children' in parent)) return;

      const file = readFileAttr(node);
      if (!file) return;

      const content = resolveFile(file);
      if (content === undefined) return;

      // Inline position can only host phrasing content. If the snippet is a
      // single paragraph, splice its phrasing children. Otherwise leave the
      // JSX alone — the caller's renderer decides what to do.
      const subtree = parseMdx(content);
      const inlineChildren = flattenToInline(subtree.children);
      if (!inlineChildren) return;

      replacements.push({
        kind: 'inline',
        index,
        parent: parent as { children: PhrasingContent[] },
        replacement: inlineChildren,
      });
    });

    // Apply replacements in reverse so earlier indices stay valid as we mutate.
    for (let i = replacements.length - 1; i >= 0; i--) {
      const r = replacements[i]!;
      r.parent.children.splice(r.index, 1, ...r.replacement);
    }
  };
}

function readFileAttr(
  node: MdxJsxFlowElement | MdxJsxTextElement,
): string | null {
  const fileAttr = node.attributes.find(
    (attr): attr is MdxJsxAttribute =>
      attr.type === 'mdxJsxAttribute' && attr.name === 'file',
  );
  return typeof fileAttr?.value === 'string' ? fileAttr.value : null;
}

function flattenToInline(blocks: RootContent[]): PhrasingContent[] | null {
  // Strip leading/trailing whitespace-only nodes (yaml, blank paragraphs)
  // so a snippet with stray whitespace still flattens.
  const meaningful = blocks.filter((b) => b.type !== 'yaml');
  if (meaningful.length !== 1) return null;
  const only = meaningful[0]!;
  if (only.type !== 'paragraph') return null;
  return (only as Paragraph).children;
}
