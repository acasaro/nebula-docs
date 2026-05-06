import { useState } from 'react';
import { RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { Mermaid } from '@nebula-docs/components';
import { cn } from '@/lib/utils';

const DEFAULT_CHART = 'graph TD;\n  A-->B;';
const ZOOM_MIN = 0.3;
const ZOOM_MAX = 3;
const ZOOM_STEP = 1.2;

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
  const [zoom, setZoom] = useState(1);

  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();
  const zoomIn = () => setZoom((z) => Math.min(ZOOM_MAX, +(z * ZOOM_STEP).toFixed(3)));
  const zoomOut = () => setZoom((z) => Math.max(ZOOM_MIN, +(z / ZOOM_STEP).toFixed(3)));
  const resetZoom = () => setZoom(1);

  return (
    <NodeViewWrapper
      data-mdx-mermaid=""
      className={cn(
        'group/mermaid my-4 overflow-hidden rounded-2xl border border-stone-200/70 dark:border-white/10',
        selected && 'ring-2 ring-primary/40',
      )}
    >
      {/* Preview panel — rendered diagram, with zoom controls in the
          top-left. Read-only; users edit the diagram via the source
          editor below. min-height gives small diagrams room to breathe
          rather than collapsing to a strip a few pixels tall. */}
      <div
        contentEditable={false}
        className="relative min-h-[280px] overflow-auto bg-white dark:bg-stone-900/40"
      >
        {editor.isEditable ? (
          <div className="absolute left-2 top-2 z-10 flex items-center gap-1 rounded-md border bg-background/80 p-0.5 backdrop-blur-sm">
            <button
              type="button"
              aria-label="Zoom in"
              onMouseDown={stopPm}
              onClick={(e) => { stopPm(e); zoomIn(); }}
              disabled={zoom >= ZOOM_MAX}
              className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ZoomIn className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Zoom out"
              onMouseDown={stopPm}
              onClick={(e) => { stopPm(e); zoomOut(); }}
              disabled={zoom <= ZOOM_MIN}
              className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ZoomOut className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Reset zoom"
              onMouseDown={stopPm}
              onClick={(e) => { stopPm(e); resetZoom(); }}
              disabled={zoom === 1}
              className="flex size-7 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <RotateCcw className="size-3.5" />
            </button>
          </div>
        ) : null}
        <div
          className="flex justify-center p-4"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center top',
            transition: 'transform 0.15s ease-out',
          }}
        >
          {chart.trim() ? (
            <Mermaid
              chart={chart}
              className="!my-0 !rounded-none !border-0 !bg-transparent !p-0"
            />
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Empty diagram — add Mermaid source below to preview.
            </div>
          )}
        </div>
      </div>

      {/* Source panel — editable Mermaid markdown. Wrapped to look like
          a fenced code block (`\`\`\`mermaid` prefix + body + `\`\`\``). */}
      <div
        contentEditable={false}
        className="relative border-t border-stone-200/70 bg-stone-950 dark:border-white/10"
        onMouseDown={stopPm}
        onClick={stopPm}
      >
        <div className="px-4 pt-3 font-mono text-xs leading-relaxed text-orange-300/90 select-none">
          ```mermaid
        </div>
        <textarea
          value={chart}
          placeholder={DEFAULT_CHART}
          onMouseDown={stopPm}
          onClick={stopPm}
          onChange={(e) => updateAttributes({ chart: e.target.value })}
          spellCheck={false}
          className="not-prose block min-h-[120px] w-full resize-y border-0 bg-transparent px-4 py-1 font-mono text-xs leading-relaxed text-stone-100 outline-none placeholder:text-stone-500 focus-visible:ring-0"
        />
        <div className="px-4 pb-3 font-mono text-xs leading-relaxed text-orange-300/90 select-none">
          ```
        </div>
      </div>
    </NodeViewWrapper>
  );
}
