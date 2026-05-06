import { useEffect, useMemo, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { mdxToTiptapDoc } from '@/lib/mdx/mdastToTiptap';
import { tiptapDocToMdx } from '@/lib/mdx/tiptapToMdx';
import { splitFrontmatter } from '@/lib/frontmatter';
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
import { MdxSnippet } from './MdxSnippetNode';
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

  // The Tiptap parser drops yaml frontmatter — the editor's doc is body-only.
  // To stop the editor's onUpdate from clobbering frontmatter the settings
  // panel just wrote, remember the current frontmatter block and re-attach
  // it on every emission. The settings panel updates the file's draft via a
  // separate path; we sync the latest frontmatter into this ref through a
  // `data-frontmatter` attribute the host can refresh without re-mounting
  // the editor (handled by RepoBrowser's `handleContentChange`).
  const frontmatterRef = useRef<string>(extractFrontmatterBlock(source));
  useEffect(() => {
    frontmatterRef.current = extractFrontmatterBlock(source);
  }, [source]);

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
      MdxSnippet,
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
      const body = tiptapDocToMdx(doc);
      onSourceChange?.(frontmatterRef.current + body);
    },
  });

  useEffect(() => {
    if (import.meta.env.DEV && editor) {
      (window as unknown as { __nebulaEditor?: typeof editor }).__nebulaEditor =
        editor;
    }
  }, [editor]);

  const { frontmatter } = splitFrontmatter(source);
  const fmTitle =
    typeof frontmatter?.values.title === 'string'
      ? frontmatter.values.title
      : null;
  const fmDescription =
    typeof frontmatter?.values.description === 'string'
      ? frontmatter.values.description
      : null;

  return (
    <div className={cn('mdx-prose mx-auto max-w-3xl py-10', className)}>
      {fmTitle || fmDescription ? (
        <header
          className="mb-8 border-b border-border pb-6 px-16"
          data-component-part="page-header"
        >
          {fmTitle ? (
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              {fmTitle}
            </h1>
          ) : null}
          {fmDescription ? (
            <p
              className={cn(
                'text-base text-muted-foreground',
                fmTitle && 'mt-2',
              )}
            >
              {fmDescription}
            </p>
          ) : null}
        </header>
      ) : null}
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
 *
 * Frontmatter is preserved verbatim — the Tiptap parser drops yaml nodes,
 * so we splice the original frontmatter block back in front of the
 * round-tripped body.
 */
export function normalizeMdx(source: string): string {
  const fmBlock = extractFrontmatterBlock(source);
  return fmBlock + tiptapDocToMdx(mdxToTiptapDoc(source));
}

function extractFrontmatterBlock(source: string): string {
  const split = splitFrontmatter(source);
  if (!split.frontmatter) return '';
  return source.slice(0, split.frontmatter.length);
}
