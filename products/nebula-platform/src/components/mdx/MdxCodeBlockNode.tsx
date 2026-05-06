import { useState } from 'react';
import {
  Check,
  Copy,
  Copy as DuplicateIcon,
  EllipsisVertical,
  FileText,
  ListOrdered,
  Trash2,
  WrapText,
} from 'lucide-react';
import CodeBlock from '@tiptap/extension-code-block';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditorState,
  type NodeViewProps,
} from '@tiptap/react';
import { CodeBlock as CodeBlockPreview } from '@nebula-docs/components';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

const LANGUAGES: ReadonlyArray<{ value: string; label: string }> = [
  { value: 'text', label: 'Plain text' },
  { value: 'bash', label: 'Bash' },
  { value: 'css', label: 'CSS' },
  { value: 'diff', label: 'Diff' },
  { value: 'go', label: 'Go' },
  { value: 'graphql', label: 'GraphQL' },
  { value: 'html', label: 'HTML' },
  { value: 'java', label: 'Java' },
  { value: 'javascript', label: 'JavaScript' },
  { value: 'json', label: 'JSON' },
  { value: 'jsx', label: 'JSX' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'mdx', label: 'MDX' },
  { value: 'mermaid', label: 'Mermaid' },
  { value: 'php', label: 'PHP' },
  { value: 'python', label: 'Python' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'rust', label: 'Rust' },
  { value: 'shell', label: 'Shell' },
  { value: 'sql', label: 'SQL' },
  { value: 'swift', label: 'Swift' },
  { value: 'tsx', label: 'TSX' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'yaml', label: 'YAML' },
];

export const MdxCodeBlock = CodeBlock.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      filename: { default: null },
      showLineNumbers: { default: false },
      wrapCode: { default: false },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(MdxCodeBlockView);
  },
});

function MdxCodeBlockView({
  node,
  updateAttributes,
  editor,
  getPos,
  deleteNode,
}: NodeViewProps) {
  const language = (node.attrs.language as string | null) ?? 'text';
  const filename = (node.attrs.filename as string | null) ?? null;
  const showLineNumbers = !!node.attrs.showLineNumbers;
  const wrapCode = !!node.attrs.wrapCode;
  const currentLabel =
    LANGUAGES.find((l) => l.value === language)?.label ?? language;
  const [copied, setCopied] = useState(false);

  const isInside = useEditorState({
    editor,
    selector: ({ editor }) => {
      if (!editor.isEditable) return false;
      const start = typeof getPos === 'function' ? getPos() : null;
      if (start == null) return false;
      const end = start + node.nodeSize;
      const { from, to } = editor.state.selection;
      return editor.isFocused && from >= start && to <= end;
    },
  });

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(node.textContent);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      // ignored
    }
  };

  const enterEditMode = () => {
    const start = typeof getPos === 'function' ? getPos() : null;
    if (start == null) return;
    editor
      .chain()
      .focus()
      .setTextSelection(start + 1)
      .run();
  };

  const toggleFilename = () => {
    updateAttributes({ filename: filename ? null : 'untitled' });
  };

  const duplicate = () => {
    const start = typeof getPos === 'function' ? getPos() : null;
    if (start == null) return;
    const end = start + node.nodeSize;
    editor.chain().focus().insertContentAt(end, node.toJSON()).run();
  };

  const stopPm = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <NodeViewWrapper
      className="my-4 group/code-block relative"
      data-mdx-code-block=""
      data-show-line-numbers={showLineNumbers ? 'true' : 'false'}
      data-wrap-code={wrapCode ? 'true' : 'false'}
    >
      {filename != null ? (
        <div
          contentEditable={false}
          className={cn(
            'flex items-center gap-2 rounded-t-md border border-b-0 bg-muted/40 px-3 py-1.5',
            'font-mono text-xs text-muted-foreground',
          )}
        >
          <FileText className="size-3.5 shrink-0 opacity-60" aria-hidden="true" />
          <input
            type="text"
            value={filename}
            placeholder="filename"
            onMouseDown={stopPm}
            onClick={stopPm}
            onChange={(e) => updateAttributes({ filename: e.target.value })}
            onBlur={(e) => {
              if (!e.target.value.trim()) updateAttributes({ filename: null });
            }}
            className={cn(
              'min-w-0 flex-1 border-0 bg-transparent p-0 outline-none',
              'placeholder:text-muted-foreground/60',
            )}
          />
        </div>
      ) : null}
      <pre
        className={cn(
          'overflow-x-auto border bg-muted/60 p-4 pt-9',
          'font-mono text-xs leading-relaxed',
          filename != null ? 'rounded-b-md' : 'rounded-md',
          showLineNumbers && 'mdx-code-block--lines',
          wrapCode && 'mdx-code-block--wrap',
          !isInside && 'hidden',
        )}
      >
        <NodeViewContent className="block whitespace-pre" />
      </pre>
      {!isInside ? (
        <div
          role="button"
          tabIndex={0}
          onClick={enterEditMode}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              enterEditMode();
            }
          }}
          className={cn(
            'cursor-text [&_pre]:m-0 [&_pre]:border [&_pre]:p-4 [&_pre]:pt-9',
            filename != null ? '[&_pre]:rounded-t-none [&_pre]:rounded-b-md' : '[&_pre]:rounded-md',
            showLineNumbers && '[&_pre]:mdx-code-block--lines',
            wrapCode && '[&_pre]:mdx-code-block--wrap',
          )}
        >
          <CodeBlockPreview
            code={node.textContent}
            language={language}
            fixedTheme="dark"
            className="my-0"
          />
        </div>
      ) : null}
      <div
        className={cn(
          'absolute right-2 top-2 flex items-center gap-1',
          'opacity-0 transition-opacity group-hover/code-block:opacity-100',
          'focus-within:opacity-100 data-[state=open]:opacity-100',
        )}
        contentEditable={false}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="rounded border bg-background px-2 py-0.5 text-[0.7rem] uppercase tracking-wide text-muted-foreground hover:text-foreground"
            >
              {currentLabel}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="max-h-72 overflow-y-auto">
            {LANGUAGES.map(({ value, label }) => (
              <DropdownMenuItem
                key={value}
                onSelect={() => {
                  updateAttributes({ language: value === 'text' ? null : value });
                  editor.commands.focus();
                }}
                className={cn(
                  'gap-2 text-sm',
                  value === language && 'bg-accent text-accent-foreground',
                )}
              >
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          type="button"
          aria-label={copied ? 'Copied!' : 'Copy code'}
          onClick={copy}
          className="flex size-7 items-center justify-center rounded border bg-background text-muted-foreground hover:text-foreground"
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-500" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              aria-label="Code block options"
              className="flex size-7 items-center justify-center rounded border bg-background text-muted-foreground hover:text-foreground"
            >
              <EllipsisVertical className="size-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuCheckboxItem
              checked={filename != null}
              onCheckedChange={() => toggleFilename()}
              onSelect={(e) => e.preventDefault()}
            >
              <FileText className="size-3.5" aria-hidden="true" />
              With filename
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showLineNumbers}
              onCheckedChange={(v) => updateAttributes({ showLineNumbers: !!v })}
              onSelect={(e) => e.preventDefault()}
            >
              <ListOrdered className="size-3.5" aria-hidden="true" />
              With line numbers
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={wrapCode}
              onCheckedChange={(v) => updateAttributes({ wrapCode: !!v })}
              onSelect={(e) => e.preventDefault()}
            >
              <WrapText className="size-3.5" aria-hidden="true" />
              Wrap code
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={duplicate}>
              <DuplicateIcon className="size-3.5" aria-hidden="true" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={deleteNode} variant="destructive">
              <Trash2 className="size-3.5" aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </NodeViewWrapper>
  );
}
