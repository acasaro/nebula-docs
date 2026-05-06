import { useEffect, useMemo } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { mdxToTiptapDoc } from '@/lib/mdx/mdastToTiptap';
import { tiptapDocToMdx } from '@/lib/mdx/tiptapToMdx';
import { cn } from '@/lib/utils';
import { EditorWithBlockHandle } from './BlockHandle';
import { MdxCallout } from './MdxCalloutNode';
import { MdxCard } from './MdxCardNode';
import { MdxCodeBlock } from './MdxCodeBlockNode';
import { MdxFrame } from './MdxFrameNode';
import { MdxAccordion, MdxAccordionGroup } from './MdxAccordionNode';
import {
  MdxParamField,
  MdxRequestExample,
  MdxResponseExample,
  MdxResponseField,
} from './MdxApiNodes';
import { MdxBadge } from './MdxBadgeNode';
import { MdxCardGroup, MdxColumn, MdxColumns } from './MdxColumnsNode';
import { MdxCodeGroup } from './MdxCodeGroupNode';
import { MdxExpandable } from './MdxExpandableNode';
import { MdxMermaid } from './MdxMermaidNode';
import { MdxRaw } from './MdxRawNode';
import { MdxTree, MdxTreeFile, MdxTreeFolder } from './MdxTreeNode';
import { MdxStep, MdxSteps } from './MdxStepsNode';
import { MdxTab, MdxTabs } from './MdxTabsNode';
import { MdxUpdate } from './MdxUpdateNode';
import { SlashCommand } from './slashCommand';

interface MdxEditorProps {
  source: string;
  onSourceChange?: (next: string) => void;
  className?: string;
}

export function MdxEditor({
  source,
  onSourceChange,
  className,
}: MdxEditorProps) {
  const initialDoc = useMemo(() => mdxToTiptapDoc(source), [source]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      MdxCodeBlock,
      MdxCodeGroup,
      MdxCallout,
      MdxCard,
      MdxFrame,
      MdxUpdate,
      MdxSteps,
      MdxStep,
      MdxTabs,
      MdxTab,
      MdxAccordionGroup,
      MdxAccordion,
      MdxColumns,
      MdxColumn,
      MdxCardGroup,
      MdxExpandable,
      MdxTree,
      MdxTreeFolder,
      MdxTreeFile,
      MdxParamField,
      MdxResponseField,
      MdxRequestExample,
      MdxResponseExample,
      MdxMermaid,
      MdxBadge,
      MdxRaw,
      SlashCommand,
      Placeholder.configure({
        placeholder: ({ editor, node, pos }) => {
          if (node.type.name !== 'paragraph') return '';
          let parentName: string | null = null;
          try {
            const $pos = editor.state.doc.resolve(pos);
            parentName = $pos.parent?.type.name ?? null;
          } catch {
            parentName = null;
          }
          if (parentName === 'mdxCallout') {
            return 'Start typing…';
          }
          if (parentName === 'mdxCard') {
            return 'Card description…';
          }
          // Top-level paragraphs and step bodies share the same hint.
          if (parentName === 'doc' || parentName === 'mdxStep') {
            return 'Start typing something or press "/" for commands';
          }
          return '';
        },
        showOnlyCurrent: true,
        includeChildren: true,
      }),
    ],
    content: initialDoc,
    editable: !!onSourceChange,
    editorProps: {
      attributes: {
        class: 'outline-none focus:outline-none min-h-full',
      },
    },
    onUpdate: ({ editor }) => {
      const doc = editor.getJSON() as ReturnType<typeof mdxToTiptapDoc>;
      onSourceChange?.(tiptapDocToMdx(doc));
    },
  });

  useEffect(() => {
    if (import.meta.env.DEV && editor) {
      (window as unknown as { __nebulaEditor?: typeof editor }).__nebulaEditor =
        editor;
    }
  }, [editor]);

  return (
    <div className={cn('mdx-prose mx-auto max-w-3xl py-10', className)}>
      <EditorWithBlockHandle editor={onSourceChange ? editor : null}>
        <div className="px-16">
          <EditorContent editor={editor} />
        </div>
      </EditorWithBlockHandle>
    </div>
  );
}

/**
 * Round-trip MDX through the parser and serializer. Used at load time so
 * the stored "original" matches the editor's first emission — without this,
 * any whitespace drift in the serializer would mark a file dirty on open.
 */
export function normalizeMdx(source: string): string {
  return tiptapDocToMdx(mdxToTiptapDoc(source));
}
