import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { useNavigate, useParams } from 'react-router';
import { ExternalLink } from 'lucide-react';
import {
  useSnippetContent,
  useSnippetPath,
} from '@/lib/mdx/snippetResolver';
import { cn } from '@/lib/utils';
import { MdxFragment } from './MdxRenderer';

export const MdxSnippet = Node.create({
  name: 'mdxSnippet',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      file: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-snippet]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-snippet': '' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxSnippetView);
  },
});

function MdxSnippetView({ node, selected }: NodeViewProps) {
  const file = (node.attrs.file as string | undefined) ?? '';
  const content = useSnippetContent(file);
  const path = useSnippetPath(file);
  const navigate = useNavigate();
  const params = useParams();
  const branch = (params.branch as string | undefined) ?? null;

  const openSource = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!branch) return;
    navigate(`/editor/${branch}/~/${path}`);
  };

  if (content === undefined) {
    return (
      <NodeViewWrapper
        data-mdx-snippet=""
        data-state="missing"
        className={cn(
          'my-4 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm',
          selected && 'ring-2 ring-primary/40',
        )}
      >
        <div contentEditable={false}>
          <div className="font-semibold text-destructive">Snippet not found</div>
          <div className="mt-1 font-mono text-xs text-foreground/80">
            {path}
          </div>
          <div className="mt-2 text-xs text-muted-foreground">
            The snippet hasn't loaded yet, or the file doesn't exist in the
            repo. Edits to the page won't include the snippet's body — the
            <code className="mx-1 rounded bg-background/60 px-1 py-0.5 font-mono">
              &lt;Snippet file="{file}" /&gt;
            </code>
            JSX is preserved on save.
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper
      data-mdx-snippet=""
      className={cn(
        'group/snippet relative my-4 rounded-md border-l-2 border-primary/40 bg-muted/30 pl-4 pr-2 py-1',
        selected && 'ring-2 ring-primary/40',
      )}
    >
      <div contentEditable={false} className="relative">
        {branch ? (
          <button
            type="button"
            onClick={openSource}
            className="absolute right-0 top-1 z-10 flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover/snippet:opacity-100 focus-visible:opacity-100"
            title={`Open ${path}`}
          >
            <ExternalLink className="size-3" />
            <span className="font-mono">{file}</span>
          </button>
        ) : null}
        <MdxFragment source={content} />
      </div>
    </NodeViewWrapper>
  );
}
