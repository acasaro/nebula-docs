import type { Root, RootContent } from 'mdast';
import type { MdxJsxFlowElement, MdxJsxAttribute } from 'mdast-util-mdx';
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

/**
 * unified plugin that walks the MDAST and replaces `<Snippet file="..." />`
 * JSX elements with the parsed content of the referenced snippet file.
 *
 * Resolves at both build-time (CLI) and editor-time (Platform) so the editor
 * can render snippets inline without requiring a preview build.
 *
 * Limitations:
 *  - Nested snippets (a snippet that itself contains `<Snippet>`) are not
 *    resolved recursively. Add a second pass if needed; deferred until a
 *    real use case arrives.
 *  - Block-level only. Inline `<Snippet>` (mdxJsxTextElement) is not handled.
 *  - The `resolveFile` callback is synchronous. Async loading is the
 *    consumer's job (e.g., Platform pre-fetches all `content/snippets/*.mdx`
 *    when entering the editor, then resolves synchronously here).
 */
export function remarkSnippets(options: RemarkSnippetsOptions) {
  const { resolveFile } = options;
  return function transformer(tree: Root): void {
    const replacements: Array<{
      index: number;
      parent: { children: RootContent[] };
      replacement: RootContent[];
    }> = [];

    visit(tree, 'mdxJsxFlowElement', (node: MdxJsxFlowElement, index, parent) => {
      if (node.name !== 'Snippet') return;
      if (typeof index !== 'number' || !parent || !('children' in parent)) return;

      const fileAttr = node.attributes.find(
        (attr): attr is MdxJsxAttribute =>
          attr.type === 'mdxJsxAttribute' && attr.name === 'file',
      );
      const file = typeof fileAttr?.value === 'string' ? fileAttr.value : null;
      if (!file) return;

      const content = resolveFile(file);
      if (content === undefined) return;

      const subtree = parseMdx(content);
      replacements.push({
        index,
        parent: parent as { children: RootContent[] },
        replacement: subtree.children,
      });
    });

    // Apply replacements in reverse so earlier indices stay valid as we mutate.
    for (let i = replacements.length - 1; i >= 0; i--) {
      const { index, parent, replacement } = replacements[i]!;
      parent.children.splice(index, 1, ...replacement);
    }
  };
}
