import { useState } from 'react';
import { Code2, Eye } from 'lucide-react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { Mermaid } from '@nebula-docs/components';
import { cn } from '@/lib/utils';

const DEFAULT_CHART = 'graph TD;\n  A-->B;';

export const MdxMermaid = Node.create({
  name: 'mdxMermaid',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      chart: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-mermaid]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-mermaid': '' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxMermaidView);
  },
});

function MdxMermaidView({
  node,
  selected,
  editor,
  updateAttributes,
}: NodeViewProps) {
  const chart = (node.attrs.chart as string | undefined) ?? '';
  const [mode, setMode] = useState<'preview' | 'source'>(
    chart.trim() ? 'preview' : 'source',
  );

  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <NodeViewWrapper
      data-mdx-mermaid=""
      className={cn(
        'group/mermaid relative my-4',
        selected && 'rounded-2xl ring-2 ring-primary/40',
      )}
    >
      {editor.isEditable ? (
        <div
          contentEditable={false}
          className="absolute right-2 top-2 z-10 flex items-center gap-1 rounded-md border bg-background p-0.5 opacity-0 transition-opacity group-hover/mermaid:opacity-100 focus-within:opacity-100"
        >
          <button
            type="button"
            aria-pressed={mode === 'preview'}
            onMouseDown={stopPm}
            onClick={(e) => {
              stopPm(e);
              setMode('preview');
            }}
            className={cn(
              'flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors',
              mode === 'preview' && 'bg-accent text-accent-foreground',
            )}
          >
            <Eye className="size-3.5" />
          </button>
          <button
            type="button"
            aria-pressed={mode === 'source'}
            onMouseDown={stopPm}
            onClick={(e) => {
              stopPm(e);
              setMode('source');
            }}
            className={cn(
              'flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors',
              mode === 'source' && 'bg-accent text-accent-foreground',
            )}
          >
            <Code2 className="size-3.5" />
          </button>
        </div>
      ) : null}
      {mode === 'preview' && chart.trim() ? (
        <Mermaid chart={chart} />
      ) : (
        <div className="my-4 rounded-2xl border border-stone-200/70 bg-white p-3 dark:border-white/10 dark:bg-stone-900/40">
          <textarea
            value={chart}
            placeholder={DEFAULT_CHART}
            onMouseDown={stopPm}
            onClick={stopPm}
            onChange={(e) => updateAttributes({ chart: e.target.value })}
            spellCheck={false}
            className="not-prose block min-h-[140px] w-full resize-y border-0 bg-transparent p-0 font-mono text-xs leading-relaxed outline-none placeholder:text-stone-400 dark:placeholder:text-stone-600"
          />
        </div>
      )}
    </NodeViewWrapper>
  );
}
