import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { cn } from '@/lib/utils';

export const MdxCodeGroup = Node.create({
  name: 'mdxCodeGroup',
  group: 'block',
  content: 'codeBlock+',
  defining: true,

  addAttributes() {
    return {
      dropdown: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-code-group]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-code-group': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxCodeGroupView);
  },
});

interface CodeBlockInfo {
  filename: string;
  language: string | null;
  pos: number;
}

function MdxCodeGroupView({ node, editor, getPos }: NodeViewProps) {
  const [active, setActive] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const codeBlocks: CodeBlockInfo[] = [];
  if (typeof getPos === 'function') {
    const start = getPos();
    if (start != null) {
      let cursor = start + 1;
      node.forEach((child) => {
        if (child.type.name === 'codeBlock') {
          codeBlocks.push({
            filename: (child.attrs.filename as string | null) ?? '',
            language: (child.attrs.language as string | null) ?? null,
            pos: cursor,
          });
        }
        cursor += child.nodeSize;
      });
    }
  }

  const clamped = codeBlocks.length === 0 ? 0 : Math.min(active, codeBlocks.length - 1);

  // ProseMirror renders every codeBlock; show one panel at a time by toggling
  // display imperatively. The selector descends through the wrapper Tiptap
  // adds around React node views, but stops at the first `data-mdx-code-block`
  // (without diving into nested code groups, if anyone ever renders one).
  useEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;
    const panelsContainer = root.querySelector('.mdx-code-group-panels');
    if (!panelsContainer) return;
    const blocks: HTMLElement[] = [];
    const walk = (node: Element) => {
      if (node instanceof HTMLElement && node.dataset.mdxCodeBlock !== undefined) {
        blocks.push(node);
        return;
      }
      for (const child of Array.from(node.children)) walk(child);
    };
    walk(panelsContainer);
    blocks.forEach((el, i) => {
      el.style.display = i === clamped ? '' : 'none';
    });
  });

  const updateFilename = (pos: number, nextFilename: string) => {
    editor
      .chain()
      .command(({ tr }) => {
        const child = tr.doc.nodeAt(pos);
        if (!child) return false;
        tr.setNodeMarkup(pos, undefined, {
          ...child.attrs,
          filename: nextFilename || null,
        });
        return true;
      })
      .run();
  };

  const appendBlock = () => {
    if (typeof getPos !== 'function' || !editor.isEditable) return;
    const start = getPos();
    if (start == null) return;
    const insertAt = start + node.nodeSize - 1;
    editor
      .chain()
      .focus()
      .insertContentAt(insertAt, {
        type: 'codeBlock',
        attrs: { language: 'text', filename: null },
      })
      .run();
    setActive(codeBlocks.length);
  };

  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <NodeViewWrapper
      data-mdx-code-group=""
      className="my-5 overflow-hidden rounded-2xl border border-stone-950/10 dark:border-white/10"
      ref={wrapperRef}
    >
      <div
        role="tablist"
        contentEditable={false}
        className="flex items-center gap-1 border-b border-stone-200/70 bg-stone-50 pr-2.5 dark:border-white/10 dark:bg-stone-900/40"
      >
        <div className="flex w-0 flex-1 gap-1 overflow-x-auto text-xs leading-6">
          {codeBlocks.map((info, i) => {
            const isActive = i === clamped;
            const placeholder =
              info.filename ||
              (info.language ? info.language : `Code ${i + 1}`);
            return (
              <input
                key={info.pos}
                role="tab"
                aria-selected={isActive}
                value={info.filename}
                placeholder={placeholder}
                onMouseDown={stopPm}
                onClick={(e) => {
                  stopPm(e);
                  setActive(i);
                }}
                onFocus={() => setActive(i)}
                onChange={(e) => updateFilename(info.pos, e.target.value)}
                className={cn(
                  'my-1 mb-1.5 ml-2.5 max-w-max border-0 bg-transparent px-1.5 font-medium outline-none',
                  isActive
                    ? 'text-primary dark:text-primary-light'
                    : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200',
                  'placeholder:text-stone-400 dark:placeholder:text-stone-600',
                )}
                style={{ width: `${Math.max(info.filename.length || placeholder.length, 4) + 1}ch` }}
              />
            );
          })}
        </div>
        {editor.isEditable ? (
          <button
            type="button"
            aria-label="Add code block"
            onMouseDown={stopPm}
            onClick={(e) => {
              stopPm(e);
              appendBlock();
            }}
            className="flex size-7 items-center justify-center rounded text-stone-400 hover:bg-stone-200/60 hover:text-stone-700 dark:text-stone-500 dark:hover:bg-stone-700/40 dark:hover:text-stone-200"
          >
            <Plus className="size-3.5" />
          </button>
        ) : null}
      </div>
      <NodeViewContent className="mdx-code-group-panels" />
    </NodeViewWrapper>
  );
}
