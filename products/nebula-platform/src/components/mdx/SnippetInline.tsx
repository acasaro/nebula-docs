import { useSnippetContent, useSnippetPath } from '@/lib/mdx/snippetResolver';
import { MdxFragment } from './MdxRenderer';

interface SnippetInlineProps {
  file?: string;
}

/**
 * Renders a `<Snippet file="..." />` JSX element inside the read-only
 * MdxRenderer / MdxFragment surface. Used for snippets that surface inside
 * `mdxRaw` blocks (where the parent JSX block isn't broken out into its own
 * Tiptap NodeView yet). The Tiptap editor's primary surface uses
 * {@link MdxSnippet} instead, which adds chrome (left border, "open source"
 * affordance) on top of the same resolver context.
 */
export function SnippetInline({ file = '' }: SnippetInlineProps) {
  const content = useSnippetContent(file);
  const path = useSnippetPath(file);

  if (content === undefined) {
    return (
      <div
        className="my-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm"
        data-component-part="snippet-missing"
      >
        <div className="font-semibold text-destructive">Snippet not found</div>
        <div className="mt-1 font-mono text-xs text-foreground/80">{path}</div>
      </div>
    );
  }

  return (
    <div
      className="my-4 rounded-md border-l-2 border-primary/40 bg-muted/30 pl-4 pr-2 py-1"
      data-component-part="snippet-inline"
    >
      <MdxFragment source={content} />
    </div>
  );
}
