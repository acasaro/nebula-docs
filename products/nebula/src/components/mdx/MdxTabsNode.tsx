import { useRef, useState } from 'react';
import { EllipsisVertical, Plus } from 'lucide-react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { AttributesPopover } from '@/components/AttributesPopover';
import { AttributesForm } from '@/components/AttributesForm';
import { tabSchema, tabsSchema } from '@/lib/blockSchemas/tabs';
import { cn } from '@/lib/utils';

export const MdxTabs = Node.create({
  name: 'mdxTabs',
  group: 'block',
  content: 'mdxTab+',
  defining: true,

  addAttributes() {
    return {
      defaultTabIndex: { default: null },
      ariaLabel: { default: null },
    };
  },

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

function MdxTabsView({
  node,
  selected,
  editor,
  getPos,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const [attrOpen, setAttrOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const stopPm = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  const appendTab = () => {
    if (typeof getPos !== 'function' || !editor.isEditable) return;
    const pos = getPos();
    if (pos == null) return;
    const insertAt = pos + node.nodeSize - 1;
    editor
      .chain()
      .focus()
      .insertContentAt(insertAt, {
        type: 'mdxTab',
        content: [{ type: 'paragraph' }],
      })
      .setTextSelection(insertAt + 2)
      .run();
  };

  return (
    <NodeViewWrapper
      data-mdx-tabs=""
      className={cn(
        'group/tabs relative my-4 overflow-hidden rounded-2xl border border-stone-200/70 dark:border-white/10',
        selected && 'ring-2 ring-primary/40',
      )}
    >
      <div ref={wrapperRef} data-component-part="tabs">
        <NodeViewContent />
      </div>
      {editor.isEditable ? (
        <div
          contentEditable={false}
          className="border-t border-stone-200/70 px-4 py-2 dark:border-white/10"
        >
          <button
            type="button"
            onClick={appendTab}
            className="flex items-center gap-2 text-sm text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
          >
            <Plus className="size-4" />
            Add tab
          </button>
        </div>
      ) : null}

      <div contentEditable={false} className="absolute right-2 top-2 z-10">
        <button
          type="button"
          aria-label="Edit tabs attributes"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setAttrOpen(true);
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded text-stone-400 transition-all dark:text-stone-500',
            'opacity-0 group-hover/tabs:opacity-100 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200',
            attrOpen && 'opacity-100',
          )}
        >
          <EllipsisVertical className="size-4" />
        </button>
      </div>

      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={wrapperRef.current}
        title={tabsSchema.title}
        titleIcon={tabsSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={tabsSchema}
          values={node.attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}

function MdxTabView({
  node,
  selected,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const titleAttr = (node.attrs.title as string | null) ?? '';
  const [attrOpen, setAttrOpen] = useState(false);
  const tabRef = useRef<HTMLDivElement>(null);

  const stopPm = (e: React.SyntheticEvent) => {
    e.stopPropagation();
  };

  return (
    <NodeViewWrapper
      data-mdx-tab=""
      className={cn(
        'group/tab relative border-b border-stone-200/70 px-4 py-3 last:border-b-0 dark:border-white/10',
        selected && 'ring-2 ring-primary/40',
      )}
    >
      <div ref={tabRef}>
        <input
          value={titleAttr}
          placeholder="Tab title"
          onChange={(e) => updateAttributes({ title: e.target.value || null })}
          onClick={stopPm}
          onMouseDown={stopPm}
          className="not-prose mb-2 w-full border-0 bg-transparent p-0 text-sm font-semibold text-stone-900 outline-none placeholder:text-muted-foreground/55 dark:text-stone-200"
        />
        <div className="text-stone-700 dark:text-stone-300">
          <NodeViewContent />
        </div>
      </div>

      <div contentEditable={false} className="absolute right-2 top-2">
        <button
          type="button"
          aria-label="Edit tab attributes"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setAttrOpen(true);
          }}
          className={cn(
            'flex size-6 items-center justify-center rounded text-stone-400 transition-all dark:text-stone-500',
            'opacity-0 group-hover/tab:opacity-100 hover:bg-stone-100 hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-200',
            attrOpen && 'opacity-100',
          )}
        >
          <EllipsisVertical className="size-4" />
        </button>
      </div>

      <AttributesPopover
        open={attrOpen}
        onOpenChange={setAttrOpen}
        anchorEl={tabRef.current}
        title={tabSchema.title}
        titleIcon={tabSchema.headerIcon}
        onDelete={deleteNode}
      >
        <AttributesForm
          schema={tabSchema}
          values={node.attrs}
          onChange={updateAttributes}
        />
      </AttributesPopover>
    </NodeViewWrapper>
  );
}
