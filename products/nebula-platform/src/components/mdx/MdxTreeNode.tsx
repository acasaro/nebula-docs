import { useState } from 'react';
import {
  ChevronRight,
  File as FileIcon,
  Folder,
  FolderOpen,
  FilePlus,
  FolderPlus,
  X,
} from 'lucide-react';
import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { cn } from '@/lib/utils';

const TREE_INDENT_PX = 22;
const TREE_BASE_PADDING_PX = 6;

export const MdxTree = Node.create({
  name: 'mdxTree',
  group: 'block',
  content: 'mdxTreeItem*',
  defining: true,

  parseHTML() {
    return [{ tag: 'div[data-mdx-tree]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-tree': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxTreeView);
  },
});

export const MdxTreeFolder = Node.create({
  name: 'mdxTreeFolder',
  group: 'mdxTreeItem',
  content: 'mdxTreeItem*',
  defining: true,

  addAttributes() {
    return {
      name: { default: '' },
      defaultOpen: { default: null },
      openable: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-tree-folder]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-tree-folder': '' }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxTreeFolderView);
  },
});

export const MdxTreeFile = Node.create({
  name: 'mdxTreeFile',
  group: 'mdxTreeItem',
  atom: true,
  selectable: true,
  draggable: false,

  addAttributes() {
    return {
      name: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-tree-file]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-tree-file': '' }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxTreeFileView);
  },
});

function MdxTreeView({ node, selected, editor, getPos }: NodeViewProps) {
  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();

  const insertItem = (type: 'mdxTreeFile' | 'mdxTreeFolder') => {
    if (typeof getPos !== 'function' || !editor.isEditable) return;
    const start = getPos();
    if (start == null) return;
    const insertAt = start + node.nodeSize - 1;
    const payload =
      type === 'mdxTreeFile'
        ? { type, attrs: { name: '' } }
        : {
            type,
            attrs: { name: '' },
            content: [],
          };
    editor.chain().focus().insertContentAt(insertAt, payload).run();
  };

  return (
    <NodeViewWrapper
      data-mdx-tree=""
      role="tree"
      aria-label="File tree"
      className={cn('my-4', selected && 'rounded-md ring-2 ring-primary/40')}
    >
      <NodeViewContent />
      {editor.isEditable ? (
        <div
          contentEditable={false}
          className="mt-1 flex items-center gap-1 pl-1.5"
        >
          <button
            type="button"
            aria-label="Add file"
            onMouseDown={stopPm}
            onClick={(e) => {
              stopPm(e);
              insertItem('mdxTreeFile');
            }}
            className="flex h-6 items-center gap-1 rounded px-1.5 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          >
            <FilePlus className="size-3.5" />
            File
          </button>
          <button
            type="button"
            aria-label="Add folder"
            onMouseDown={stopPm}
            onClick={(e) => {
              stopPm(e);
              insertItem('mdxTreeFolder');
            }}
            className="flex h-6 items-center gap-1 rounded px-1.5 text-xs text-stone-500 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
          >
            <FolderPlus className="size-3.5" />
            Folder
          </button>
        </div>
      ) : null}
    </NodeViewWrapper>
  );
}

function getTreeLevel(editor: NodeViewProps['editor'], pos: number): number {
  const $pos = editor.state.doc.resolve(pos);
  let level = 0;
  for (let depth = $pos.depth; depth > 0; depth--) {
    const ancestor = $pos.node(depth);
    if (ancestor.type.name === 'mdxTreeFolder') level++;
    if (ancestor.type.name === 'mdxTree') break;
  }
  return level + 1;
}

function MdxTreeFolderView({
  node,
  selected,
  editor,
  getPos,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const attrs = node.attrs as { name?: string; defaultOpen?: boolean | null };
  const [open, setOpen] = useState(attrs.defaultOpen ?? true);
  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();

  const level =
    typeof getPos === 'function'
      ? (() => {
          const p = getPos();
          return p == null ? 1 : getTreeLevel(editor, p);
        })()
      : 1;

  const padLeft = TREE_BASE_PADDING_PX + (level - 1) * TREE_INDENT_PX;

  const insertChild = (type: 'mdxTreeFile' | 'mdxTreeFolder') => {
    if (typeof getPos !== 'function' || !editor.isEditable) return;
    const start = getPos();
    if (start == null) return;
    const insertAt = start + node.nodeSize - 1;
    const payload =
      type === 'mdxTreeFile'
        ? { type, attrs: { name: '' } }
        : { type, attrs: { name: '' }, content: [] };
    editor.chain().focus().insertContentAt(insertAt, payload).run();
    setOpen(true);
  };

  return (
    <NodeViewWrapper
      data-mdx-tree-folder=""
      className={cn(
        'group/tree-folder',
        selected && 'rounded ring-2 ring-primary/40',
      )}
      style={{ paddingLeft: padLeft }}
    >
      <div
        contentEditable={false}
        className="flex items-center gap-1 py-1"
      >
        <button
          type="button"
          aria-label={open ? 'Collapse folder' : 'Expand folder'}
          aria-expanded={open}
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            setOpen((p) => !p);
          }}
          className="flex size-4 items-center justify-center rounded text-stone-400 hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200"
        >
          <ChevronRight
            className={cn('size-3.5 transition-transform', open && 'rotate-90')}
          />
        </button>
        {open ? (
          <FolderOpen className="size-4 shrink-0 text-stone-500 dark:text-stone-400" />
        ) : (
          <Folder className="size-4 shrink-0 text-stone-500 dark:text-stone-400" />
        )}
        <input
          value={attrs.name ?? ''}
          placeholder="folder name"
          onMouseDown={stopPm}
          onClick={stopPm}
          onChange={(e) => updateAttributes({ name: e.target.value })}
          className="not-prose min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-medium leading-5 outline-none placeholder:text-stone-400 dark:placeholder:text-stone-600"
        />
        {editor.isEditable ? (
          <div className="flex items-center gap-0.5 opacity-0 group-hover/tree-folder:opacity-100">
            <button
              type="button"
              aria-label="Add file inside"
              onMouseDown={stopPm}
              onClick={(e) => {
                stopPm(e);
                insertChild('mdxTreeFile');
              }}
              className="flex size-5 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-200"
            >
              <FilePlus className="size-3" />
            </button>
            <button
              type="button"
              aria-label="Add folder inside"
              onMouseDown={stopPm}
              onClick={(e) => {
                stopPm(e);
                insertChild('mdxTreeFolder');
              }}
              className="flex size-5 items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700 dark:text-stone-500 dark:hover:bg-stone-800 dark:hover:text-stone-200"
            >
              <FolderPlus className="size-3" />
            </button>
            <button
              type="button"
              aria-label="Delete folder"
              onMouseDown={stopPm}
              onClick={(e) => {
                stopPm(e);
                deleteNode();
              }}
              className="flex size-5 items-center justify-center rounded text-stone-400 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="size-3" />
            </button>
          </div>
        ) : null}
      </div>
      <div
        className={cn('relative', !open && 'hidden')}
        data-component-part="tree-folder-children-wrapper"
      >
        <NodeViewContent />
      </div>
    </NodeViewWrapper>
  );
}

function MdxTreeFileView({
  node,
  selected,
  editor,
  getPos,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  const name = (node.attrs.name as string | undefined) ?? '';
  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();

  const level =
    typeof getPos === 'function'
      ? (() => {
          const p = getPos();
          return p == null ? 1 : getTreeLevel(editor, p);
        })()
      : 1;

  const padLeft = TREE_BASE_PADDING_PX + (level - 1) * TREE_INDENT_PX;

  return (
    <NodeViewWrapper
      data-mdx-tree-file=""
      className={cn(
        'group/tree-file flex items-center gap-1 py-1 pr-1.5 text-stone-700 dark:text-stone-400',
        selected && 'rounded ring-2 ring-primary/40',
      )}
      style={{ paddingLeft: padLeft }}
    >
      <FileIcon className="size-4 shrink-0 text-stone-500 dark:text-stone-400" />
      <input
        value={name}
        placeholder="file name"
        onMouseDown={stopPm}
        onClick={stopPm}
        onChange={(e) => updateAttributes({ name: e.target.value })}
        className="not-prose min-w-0 flex-1 border-0 bg-transparent p-0 text-sm font-medium leading-5 outline-none placeholder:text-stone-400 dark:placeholder:text-stone-600"
      />
      {editor.isEditable ? (
        <button
          type="button"
          aria-label="Delete file"
          onMouseDown={stopPm}
          onClick={(e) => {
            stopPm(e);
            deleteNode();
          }}
          className="flex size-5 items-center justify-center rounded text-stone-400 opacity-0 hover:bg-destructive/10 hover:text-destructive group-hover/tree-file:opacity-100"
        >
          <X className="size-3" />
        </button>
      ) : null}
    </NodeViewWrapper>
  );
}
