import { useEffect, useMemo, useRef } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import { mdxToTiptapDoc } from '@/lib/mdx/mdastToTiptap';
import { tiptapDocToMdx } from '@/lib/mdx/tiptapToMdx';
import { cn } from '@/lib/utils';
import { EditorWithBlockHandle } from './BlockHandle';
import { MdxCallout } from './MdxCalloutNode';
import { MdxRaw } from './MdxRawNode';

interface MdxEditorProps {
  source: string;
  onSourceChange?: (next: string) => void;
  onDirtyChange?: (dirty: boolean) => void;
  className?: string;
}

export function MdxEditor({
  source,
  onSourceChange,
  onDirtyChange,
  className,
}: MdxEditorProps) {
  const initialDoc = useMemo(() => mdxToTiptapDoc(source), [source]);
  const initialDocJsonRef = useRef<string>('');
  const lastDirtyRef = useRef<boolean>(false);

  const editor = useEditor({
    extensions: [StarterKit, MdxCallout, MdxRaw],
    content: initialDoc,
    editable: !!onSourceChange,
    editorProps: {
      attributes: {
        class: 'outline-none focus:outline-none min-h-full',
      },
    },
    onCreate: ({ editor }) => {
      initialDocJsonRef.current = normalizeDocJson(editor.getJSON());
    },
    onUpdate: ({ editor }) => {
      const doc = editor.getJSON() as ReturnType<typeof mdxToTiptapDoc>;
      onSourceChange?.(tiptapDocToMdx(doc));
      const dirty = normalizeDocJson(doc) !== initialDocJsonRef.current;
      if (dirty !== lastDirtyRef.current) {
        lastDirtyRef.current = dirty;
        onDirtyChange?.(dirty);
      }
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

interface DocLike {
  type?: string;
  content?: DocLike[];
}

/**
 * Strip trailing empty paragraphs ProseMirror auto-inserts when the doc
 * ends with an atom node (so the user has somewhere to type after it).
 * Without this, dirty would fire after focus + undo even though the
 * meaningful content matches load state.
 */
function normalizeDocJson(json: DocLike): string {
  const content = json.content ?? [];
  let end = content.length;
  while (end > 0) {
    const last = content[end - 1];
    if (last?.type === 'paragraph' && !last.content?.length) {
      end--;
    } else {
      break;
    }
  }
  return JSON.stringify({ ...json, content: content.slice(0, end) });
}
