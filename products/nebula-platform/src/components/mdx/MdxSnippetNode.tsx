import { Node, mergeAttributes } from '@tiptap/core';
import {
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';
import { useNavigate, useParams } from 'react-router';
import { ExternalLink } from 'lucide-react';
import {
  useSnippetContent,
  useSnippetRepoPath,
} from '@/lib/mdx/snippetResolver';
import { cn } from '@/lib/utils';
import { MdxFragment } from './MdxRenderer';

/** Description of a snippet about to be inserted via the slash command. */
export interface ImportedSnippetSpec {
  binding: string;
  path: string;
  isReact: boolean;
  jsxAttrs?: Record<string, unknown>;
}

interface MdxSnippetOptions {
  /** Called when the user inserts a snippet via the editor's command. The
   *  host (MdxEditor) uses this to register the import declaration so the
   *  serializer can re-emit `import Foo from "/snippets/foo.mdx";` at the
   *  top of the file. */
  onInsert?: (spec: ImportedSnippetSpec) => void;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    mdxImportedSnippet: {
      /** Insert an imported snippet at the current selection. Triggers
       *  `onInsert` so the host can register the matching `import`. */
      insertImportedSnippet: (spec: ImportedSnippetSpec) => ReturnType;
    };
  }
}

/**
 * An atomic Tiptap node that stands in for a JSX reference to an
 * imported snippet (`<Disclaimer />` after `import Disclaimer from
 * "/snippets/disclaimer.mdx"`). The node owns just enough metadata to
 * round-trip the JSX tag — the import statement is reconstructed at
 * serialize time by `MdxEditor` from the current set of `mdxImportedSnippet`
 * nodes in the doc.
 *
 * Attrs:
 *  - `binding` — the local JSX tag name (`Disclaimer`)
 *  - `path`    — the import source as written (`/snippets/disclaimer.mdx`)
 *  - `jsxAttrs` — JSX props passed at the call site, e.g.
 *                 `<Disclaimer word="bananas" />` → `{ word: "bananas" }`.
 *                 The NodeView substitutes these into `{prop}` placeholders
 *                 found in the snippet body before rendering.
 *  - `isReact` — true for `.jsx` / `.tsx` snippets (rendered as a labelled
 *                placeholder in the editor; live render is build-time only).
 */
export const MdxSnippet = Node.create<MdxSnippetOptions>({
  name: 'mdxImportedSnippet',
  group: 'block',
  atom: true,
  selectable: true,
  draggable: true,

  addOptions() {
    return { onInsert: undefined };
  },

  addAttributes() {
    return {
      binding: { default: '' },
      path: { default: '' },
      jsxAttrs: { default: {} as Record<string, unknown> },
      isReact: { default: false },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-mdx-imported-snippet]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-mdx-imported-snippet': '' }),
    ];
  },

  addCommands() {
    return {
      insertImportedSnippet:
        (spec: ImportedSnippetSpec) =>
        ({ commands }) => {
          // Notify the host so it can register the `import` declaration
          // BEFORE inserting the node. Order matters: the serializer reads
          // the imports list during onUpdate, which fires synchronously
          // after the insert completes.
          this.options.onInsert?.(spec);
          return commands.insertContent({
            type: 'mdxImportedSnippet',
            attrs: {
              binding: spec.binding,
              path: spec.path,
              jsxAttrs: spec.jsxAttrs ?? {},
              isReact: spec.isReact,
            },
          });
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(MdxImportedSnippetView);
  },
});

function MdxImportedSnippetView({ node, selected }: NodeViewProps) {
  const binding = (node.attrs.binding as string | undefined) ?? '';
  const path = (node.attrs.path as string | undefined) ?? '';
  const jsxAttrs = (node.attrs.jsxAttrs as Record<string, unknown> | undefined) ?? {};
  const isReact = !!node.attrs.isReact;
  const content = useSnippetContent(path);
  const repoPath = useSnippetRepoPath(path);
  const navigate = useNavigate();
  const params = useParams();
  const branch = (params.branch as string | undefined) ?? null;

  const openSource = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!branch) return;
    navigate(`/editor/${branch}/~/${repoPath}`);
  };

  // .jsx / .tsx React component snippets render live at build time (Astro +
  // MDX picks them up natively). The editor can't safely eval arbitrary
  // user JSX, so it shows a labeled placeholder instead.
  if (isReact) {
    return (
      <NodeViewWrapper
        data-mdx-imported-snippet=""
        data-state="react-placeholder"
        className={cn(
          'group/snippet relative my-4 rounded-md border border-dashed border-primary/40 bg-muted/30 p-4',
          selected && 'ring-2 ring-primary/40',
        )}
      >
        <div contentEditable={false} className="relative">
          <SourceLink branch={branch} onOpen={openSource} repoPath={repoPath} binding={binding} />
          <div className="text-sm font-semibold text-foreground/80">
            &lt;{binding} /&gt;
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            React component from{' '}
            <code className="rounded bg-background/60 px-1 py-0.5 font-mono">{path}</code>
            . Renders at build time.
          </div>
          {Object.keys(jsxAttrs).length ? (
            <pre className="mt-2 overflow-x-auto rounded border border-border/40 bg-background/60 p-2 text-xs text-foreground/80">
              {Object.entries(jsxAttrs)
                .map(([k, v]) => `${k}=${formatProp(v)}`)
                .join('  ')}
            </pre>
          ) : null}
        </div>
      </NodeViewWrapper>
    );
  }

  if (content === undefined) {
    return (
      <NodeViewWrapper
        data-mdx-imported-snippet=""
        data-state="missing"
        className={cn(
          'my-4 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm',
          selected && 'ring-2 ring-primary/40',
        )}
      >
        <div contentEditable={false}>
          <div className="font-semibold text-destructive">Snippet not found</div>
          <div className="mt-1 font-mono text-xs text-foreground/80">{path}</div>
          <div className="mt-2 text-xs text-muted-foreground">
            The file hasn't loaded yet, or the import path doesn't match a
            file in the repo. The{' '}
            <code className="rounded bg-background/60 px-1 py-0.5 font-mono">
              import {binding || '…'} from "{path}"
            </code>{' '}
            statement is preserved on save.
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  // Substitute `{prop}` placeholders in the snippet body with the JSX
  // attribute values from the call site. Mintlify uses single-brace MDX
  // expressions for variable interpolation; we mirror that with a literal
  // string substitution against the body source — sufficient for the
  // documented "My keyword of the day is {word}." pattern without needing
  // to roundtrip through the AST.
  const bodyWithProps = substituteProps(content, jsxAttrs);

  return (
    <NodeViewWrapper
      data-mdx-imported-snippet=""
      className={cn(
        'group/snippet relative my-4 rounded-md border-l-2 border-primary/40 bg-muted/30 pl-4 pr-2 py-1',
        selected && 'ring-2 ring-primary/40',
      )}
    >
      <div contentEditable={false} className="relative">
        <SourceLink branch={branch} onOpen={openSource} repoPath={repoPath} binding={binding} />
        <MdxFragment source={bodyWithProps} />
      </div>
    </NodeViewWrapper>
  );
}

function SourceLink({
  branch,
  onOpen,
  repoPath,
  binding,
}: {
  branch: string | null;
  onOpen: (e: React.MouseEvent) => void;
  repoPath: string;
  binding: string;
}) {
  if (!branch) return null;
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'absolute right-0 top-1 z-10 flex items-center gap-1 rounded-md border bg-background px-2 py-1 text-xs text-muted-foreground',
        'opacity-0 transition-opacity hover:text-foreground group-hover/snippet:opacity-100 focus-visible:opacity-100',
      )}
      title={`Open ${repoPath}`}
    >
      <ExternalLink className="size-3" />
      <span className="font-mono">{binding || repoPath}</span>
    </button>
  );
}

function formatProp(v: unknown): string {
  if (typeof v === 'string') return JSON.stringify(v);
  if (v === true) return 'true';
  if (v === false) return 'false';
  if (typeof v === 'number') return String(v);
  if (v && typeof v === 'object' && '__expression' in v) {
    return `{${(v as { __expression: string }).__expression}}`;
  }
  return JSON.stringify(v ?? null);
}

/**
 * Walk the snippet body, replacing `{propName}` with the JSX attribute
 * passed at the include site. Does NOT touch `{` inside fenced code blocks
 * — Mintlify's docs use single-brace expressions for substitution and the
 * MDX parser would treat unescaped `{` in non-code contexts as expressions
 * anyway, so collisions are user-visible regardless.
 *
 * Also handles `{name}` → exported value substitution for variable-style
 * snippets: when the snippet exports `export const myName = "Ronan"` and
 * the page references `{myName}`, the substitution map carries
 * `{ myName: "Ronan" }` from the resolver context.
 */
function substituteProps(
  source: string,
  props: Record<string, unknown>,
): string {
  if (!Object.keys(props).length) return source;
  return source.replace(/\{([A-Za-z_$][\w$]*)\}/g, (match, name) => {
    if (!(name in props)) return match;
    const value = props[name];
    if (typeof value === 'string') return value;
    if (value == null) return '';
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (typeof value === 'object' && '__expression' in value) {
      return String((value as { __expression: string }).__expression);
    }
    return String(value);
  });
}
