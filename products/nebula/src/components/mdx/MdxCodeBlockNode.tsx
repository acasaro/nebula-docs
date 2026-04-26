import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import CodeBlock from '@tiptap/extension-code-block';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditorState,
  type NodeViewProps,
} from '@tiptap/react';
import { CodeBlock as CodeBlockPreview } from '@nebula/components';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  addNodeView() {
    return ReactNodeViewRenderer(MdxCodeBlockView);
  },
});

function MdxCodeBlockView({
  node,
  updateAttributes,
  editor,
  getPos,
}: NodeViewProps) {
  const language = (node.attrs.language as string | null) ?? 'text';
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

  return (
    <NodeViewWrapper
      className="my-4 group/code-block relative"
      data-mdx-code-block=""
    >
      <pre
        className={cn(
          'overflow-x-auto rounded-md border bg-muted/60 p-4 pt-9',
          'font-mono text-xs leading-relaxed',
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
          className="cursor-text [&_pre]:m-0 [&_pre]:rounded-md [&_pre]:border [&_pre]:p-4 [&_pre]:pt-9"
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
          'focus-within:opacity-100',
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
      </div>
    </NodeViewWrapper>
  );
}
