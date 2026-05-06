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

export const MdxTabs = Node.create({
  name: 'mdxTabs',
  group: 'block',
  content: 'mdxTab+',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-mdx-tabs]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-tabs': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxTabsView);
  },
});

export const MdxTab = Node.create({
  name: 'mdxTab',
  group: 'mdxTabItem',
  content: 'block+',
  defining: true,

  addAttributes() {
    return {
      title: { default: null },
      id: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-tab]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-tab': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxTabView);
  },
});

interface TabInfo {
  title: string;
  pos: number;
}

function MdxTabsView({ node, editor, getPos }: NodeViewProps) {
  const [active, setActive] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const tabs: TabInfo[] = [];
  if (typeof getPos === 'function') {
    const start = getPos();
    if (start != null) {
      let cursor = start + 1;
      node.forEach((child) => {
        if (child.type.name === 'mdxTab') {
          tabs.push({
            title: (child.attrs.title as string | null) ?? '',
            pos: cursor,
          });
        }
        cursor += child.nodeSize;
      });
    }
  }

  const clampedActive = tabs.length === 0 ? 0 : Math.min(active, tabs.length - 1);

  // ProseMirror renders every mdxTab into NodeViewContent, but only one panel
  // should be visible at a time. Sync DOM display imperatively whenever the
  // active index or the children change.
  useEffect(() => {
    const root = wrapperRef.current;
    if (!root) return;
    const panels = root.querySelectorAll<HTMLElement>(
      ':scope > .mdx-tabs-panels > [data-mdx-tab]',
    );
    panels.forEach((el, i) => {
      el.style.display = i === clampedActive ? '' : 'none';
    });
  });

  const updateTitle = (pos: number, nextTitle: string) => {
    editor
      .chain()
      .command(({ tr }) => {
        const child = tr.doc.nodeAt(pos);
        if (!child) return false;
        tr.setNodeMarkup(pos, undefined, {
          ...child.attrs,
          title: nextTitle || null,
        });
        return true;
      })
      .run();
  };

  const appendTab = () => {
    if (typeof getPos !== 'function' || !editor.isEditable) return;
    const start = getPos();
    if (start == null) return;
    const insertAt = start + node.nodeSize - 1;
    editor
      .chain()
      .focus()
      .insertContentAt(insertAt, {
        type: 'mdxTab',
        attrs: { title: null },
        content: [{ type: 'paragraph' }],
      })
      .run();
    setActive(tabs.length);
  };

  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <NodeViewWrapper
      data-mdx-tabs=""
      className="my-4"
      ref={wrapperRef}
    >
      <div
        role="tablist"
        contentEditable={false}
        className="not-prose mb-4 flex min-w-full flex-none items-end gap-x-1 overflow-auto border-b border-stone-200 dark:border-stone-700"
      >
        {tabs.map((tab, i) => {
          const isActive = i === clampedActive;
          return (
            <input
              key={tab.pos}
              role="tab"
              aria-selected={isActive}
              value={tab.title}
              placeholder={`Tab ${i + 1}`}
              onMouseDown={stopPm}
              onClick={(e) => {
                stopPm(e);
                setActive(i);
              }}
              onFocus={() => setActive(i)}
              onChange={(e) => updateTitle(tab.pos, e.target.value)}
              className={cn(
                '-mb-px max-w-max border-0 border-b bg-transparent px-1 pt-3 pb-2.5 text-sm font-semibold leading-6 outline-none transition-colors',
                'placeholder:text-stone-400 dark:placeholder:text-stone-600',
                isActive
                  ? 'border-current text-stone-900 dark:text-stone-100'
                  : 'border-transparent text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-200',
              )}
              style={{ width: `${Math.max(tab.title.length, 4) + 2}ch` }}
            />
          );
        })}
        {editor.isEditable ? (
          <button
            type="button"
            aria-label="Add tab"
            onMouseDown={stopPm}
            onClick={(e) => {
              stopPm(e);
              appendTab();
            }}
            className="-mb-px flex size-7 items-center justify-center rounded-t border-b border-transparent text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200"
          >
            <Plus className="size-4" />
          </button>
        ) : null}
      </div>
      <NodeViewContent className="mdx-tabs-panels" />
    </NodeViewWrapper>
  );
}

function MdxTabView({ selected }: NodeViewProps) {
  return (
    <NodeViewWrapper
      data-mdx-tab=""
      className={cn(
        'prose dark:prose-invert',
        selected && 'rounded ring-2 ring-primary/40',
      )}
    >
      <NodeViewContent />
    </NodeViewWrapper>
  );
}
