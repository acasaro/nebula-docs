import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import type { ImportSpec } from '@nebula-docs/mdx';
import {
  AssetUploadProgress,
  MediaPickerDialog,
  type PickedMedia,
} from '@/components/assets';
import { useAssetUpload } from '@/lib/assets';
import { parseMdxForEditor } from '@/lib/mdx/mdastToTiptap';
import { tiptapDocToMdx } from '@/lib/mdx/tiptapToMdx';
import { splitFrontmatter } from '@/lib/frontmatter';
import { useSnippetCatalog } from '@/lib/mdx/snippetResolver';
import { cn } from '@/lib/utils';
import { EditorWithBlockHandle } from './BlockHandle';
import { MdxCallout } from './MdxCalloutNode';
import { MdxCard } from './MdxCardNode';
import { MdxCodeBlock } from './MdxCodeBlockNode';
import { MdxFrame } from './MdxFrameNode';
import { MdxHero } from './MdxHeroNode';
import { MdxImage } from './MdxImageNode';
import {
  MdxTable,
  MdxTableCell,
  MdxTableHeader,
  MdxTableRow,
} from './MdxTableNode';
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
import { MdxProfile } from './MdxProfileNode';
import { MdxRaw } from './MdxRawNode';
import { MdxSnippet } from './MdxSnippetNode';
import { MdxTree, MdxTreeFile, MdxTreeFolder } from './MdxTreeNode';
import { MdxStep, MdxSteps } from './MdxStepsNode';
import { MdxTab, MdxTabs } from './MdxTabsNode';
import { MdxUpdate } from './MdxUpdateNode';
import { MdxVideo } from './MdxVideoNode';
import { SlashCommand } from './slashCommand';
import { SlashHint } from './slashHint';

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
  const initial = useMemo(() => parseMdxForEditor(source), [source]);
  const initialDoc = initial.doc;

  // The Tiptap parser drops yaml frontmatter and ES module imports/exports —
  // the editor's doc is pure body content. To stop onUpdate from clobbering
  // frontmatter the settings panel just wrote, remember the current
  // frontmatter block and re-attach it on every emission. Imports follow the
  // same pattern: the parsed list is held in a ref, the serializer
  // garbage-collects entries whose binding is no longer referenced.
  const frontmatterRef = useRef<string>(extractFrontmatterBlock(source));
  useEffect(() => {
    frontmatterRef.current = extractFrontmatterBlock(source);
  }, [source]);
  const importsRef = useRef<ImportSpec[]>(initial.imports);
  useEffect(() => {
    importsRef.current = initial.imports;
  }, [initial.imports]);

  // The slash command's catalog of available snippets is read fresh on every
  // menu open so prefetched-after-mount snippets show up without a remount.
  const snippetCatalog = useSnippetCatalog();
  const snippetCatalogRef = useRef(snippetCatalog);
  useEffect(() => {
    snippetCatalogRef.current = snippetCatalog;
  }, [snippetCatalog]);

  // Media picker state. The slash menu, drag/drop, and paste handlers all
  // funnel through `pickerState` so a single dialog instance owns the flow.
  // The mode determines what node gets inserted on pick AND which asset
  // category the picker filters to.
  type PickerState =
    | { open: false }
    | {
        open: true;
        mode: 'image' | 'figure' | 'video';
        editor: Editor;
        range: { from: number; to: number };
      };
  const [pickerState, setPickerState] = useState<PickerState>({ open: false });
  const pickerStateRef = useRef(pickerState);
  useEffect(() => {
    pickerStateRef.current = pickerState;
  }, [pickerState]);

  const upload = useAssetUpload();
  const uploadRef = useRef(upload);
  useEffect(() => {
    uploadRef.current = upload;
  }, [upload]);

  // Editor ref used by the drop/paste handlers. handleDrop is captured at
  // editor-creation time, so it can't reference `editor` directly. We read
  // from the ref, which is populated in the useEffect below.
  const editorRef = useRef<Editor | null>(null);

  const uploadDroppedFiles = useCallback(
    async (files: File[], pos: number) => {
      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const result = await uploadRef.current.upload(file);
        if (!result.asset) continue;
        const ed = editorRef.current;
        if (!ed) continue;
        ed.chain()
          .focus()
          .insertContentAt(pos, {
            type: 'mdxImage',
            attrs: {
              src: result.asset.downloadUrl,
              alt: result.asset.alt || result.asset.displayName,
              width: result.asset.width,
              height: result.asset.height,
            },
          })
          .run();
      }
    },
    [],
  );

  const insertMedia = useCallback(
    (
      editor: Editor,
      range: { from: number; to: number },
      media: PickedMedia,
      mode: 'image' | 'figure' | 'video',
    ) => {
      if (mode === 'figure') {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'mdxFrame',
            attrs: {
              src: media.src,
              alt: media.alt,
              width: media.width,
              height: media.height,
            },
            content: [{ type: 'paragraph' }],
          })
          .run();
      } else if (mode === 'video') {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'mdxVideo',
            attrs: {
              src: media.src,
              caption: null,
              loop: false,
              maxLoops: null,
            },
          })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: 'mdxImage',
            attrs: {
              src: media.src,
              alt: media.alt,
              width: media.width,
              height: media.height,
            },
          })
          .run();
      }
    },
    [],
  );

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
      MdxImage,
      MdxVideo,
      MdxProfile,
      MdxHero,
      MdxTable,
      MdxTableRow,
      MdxTableHeader,
      MdxTableCell,
      MdxSnippet.configure({
        onInsert: (spec) => {
          // Register the import for this binding/path if not already there.
          // Multiple inserts of the same snippet share one import statement;
          // re-imports of a different binding from the same path coalesce
          // via `groupImportsByPath` at serialize time.
          const exists = importsRef.current.some(
            (i) => i.binding === spec.binding && i.path === spec.path,
          );
          if (!exists) {
            importsRef.current = [
              ...importsRef.current,
              spec.isReact
                ? { kind: 'named', binding: spec.binding, source: spec.binding, path: spec.path }
                : { kind: 'default', binding: spec.binding, path: spec.path },
            ];
          }
        },
      }),
      MdxRaw,
      SlashCommand.configure({
        getSnippetCatalog: () => snippetCatalogRef.current,
        openMediaPicker: ({ mode, editor, range }) => {
          setPickerState({ open: true, mode, editor, range });
        },
      }),
      SlashHint,
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
          if (parentName === 'mdxColumn') {
            return 'Type or press "/" for commands';
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
      handleDrop(view, event, _slice, moved) {
        if (moved) return false;
        const dt = event.dataTransfer;
        if (!dt) return false;
        const files = Array.from(dt.files).filter((f) =>
          f.type.startsWith('image/'),
        );
        if (files.length === 0) return false;
        event.preventDefault();
        const coords = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });
        const pos = coords?.pos ?? view.state.selection.from;
        void uploadDroppedFiles(files, pos);
        return true;
      },
      handlePaste(view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        const files: File[] = [];
        for (const item of Array.from(items)) {
          if (item.kind !== 'file') continue;
          if (!item.type.startsWith('image/')) continue;
          const file = item.getAsFile();
          if (file) files.push(file);
        }
        if (files.length === 0) return false;
        event.preventDefault();
        const pos = view.state.selection.from;
        void uploadDroppedFiles(files, pos);
        return true;
      },
    },
    onUpdate: ({ editor }) => {
      const doc = editor.getJSON() as Parameters<typeof tiptapDocToMdx>[0];
      const body = tiptapDocToMdx(doc, importsRef.current);
      onSourceChange?.(frontmatterRef.current + body);
    },
  });

  useEffect(() => {
    if (import.meta.env.DEV && editor) {
      (window as unknown as { __nebulaEditor?: typeof editor }).__nebulaEditor =
        editor;
    }
  }, [editor]);

  useEffect(() => {
    editorRef.current = editor ?? null;
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
          className="mb-8 border-b border-border pb-6"
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
        <EditorContent editor={editor} />
      </EditorWithBlockHandle>

      <MediaPickerDialog
        open={pickerState.open}
        category={pickerState.open && pickerState.mode === 'video' ? 'video' : 'image'}
        onOpenChange={(open) => {
          if (!open) setPickerState({ open: false });
        }}
        onPick={(media: PickedMedia) => {
          if (!pickerState.open) return;
          insertMedia(
            pickerState.editor,
            pickerState.range,
            media,
            pickerState.mode,
          );
          setPickerState({ open: false });
        }}
      />
      <AssetUploadProgress
        handles={upload.handles}
        onDismiss={upload.dismiss}
        onClear={upload.dismissCompleted}
      />
    </div>
  );
}

/**
 * Round-trip MDX through the parser and serializer. Used at load time so
 * the stored "original" matches the editor's first emission — without this,
 * any whitespace drift in the serializer would mark a file dirty on open.
 *
 * Frontmatter and `import` declarations are preserved verbatim — the Tiptap
 * parser strips both. Frontmatter is spliced back in front of the
 * round-tripped body; imports are re-emitted by the serializer from the
 * parsed list (filtered to bindings actually referenced in the body).
 */
export function normalizeMdx(source: string): string {
  const fmBlock = extractFrontmatterBlock(source);
  const { doc, imports } = parseMdxForEditor(source);
  return fmBlock + tiptapDocToMdx(doc, imports);
}

function extractFrontmatterBlock(source: string): string {
  const split = splitFrontmatter(source);
  if (!split.frontmatter) return '';
  return source.slice(0, split.frontmatter.length);
}
