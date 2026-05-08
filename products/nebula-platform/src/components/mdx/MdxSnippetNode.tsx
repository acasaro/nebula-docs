import { useEffect, useState, type ComponentType } from 'react';
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
import { env } from '@/lib/env';
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

  // .jsx / .tsx React component snippets:
  //  - LOCAL backend: dynamically import the compiled module via the
  //    `/api/snippet/module` endpoint (which 302s to Vite's `/@fs` handler)
  //    and render the component live. Same React tree as the editor.
  //  - GitHub backend: source isn't on the Vite dev server's filesystem,
  //    so fall back to the labeled placeholder card.
  if (isReact) {
    return (
      <NodeViewWrapper
        data-mdx-imported-snippet=""
        data-state="react"
        className={cn(
          'group/snippet relative my-4',
          selected && 'rounded-md ring-2 ring-primary/40',
        )}
      >
        <div contentEditable={false} className="relative">
          <SourceLink branch={branch} onOpen={openSource} repoPath={repoPath} binding={binding} />
          {env.isLocalBackend ? (
            <ReactSnippetLive
              binding={binding}
              path={path}
              jsxAttrs={jsxAttrs}
            />
          ) : (
            <ReactSnippetPlaceholder
              binding={binding}
              path={path}
              jsxAttrs={jsxAttrs}
            />
          )}
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

interface ReactSnippetSubProps {
  binding: string;
  path: string;
  jsxAttrs: Record<string, unknown>;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'loaded'; Component: ComponentType<Record<string, unknown>> }
  | { status: 'error'; error: string };

/**
 * Live-render a `.tsx` snippet by dynamically importing it through Vite's
 * dev server. The module URL hits `/api/snippet/module?path=...` which the
 * local-tenant Vite plugin redirects to `/@fs/<abs>?import` so Vite handles
 * compilation and bare-import resolution against the platform's module
 * graph. Falls back to the labeled placeholder card on any failure (build
 * error, missing export, etc.) so the editor stays usable.
 */
function ReactSnippetLive({ binding, path, jsxAttrs }: ReactSnippetSubProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    const cleaned = path.replace(/^\/+/, '');
    const url = `/api/fs/snippet/module?path=${encodeURIComponent(cleaned)}`;
    setState({ status: 'loading' });
    import(/* @vite-ignore */ url)
      .then((mod: Record<string, unknown>) => {
        if (cancelled) return;
        const candidate =
          (mod.default as ComponentType<Record<string, unknown>> | undefined) ??
          (mod[binding] as ComponentType<Record<string, unknown>> | undefined);
        if (!candidate) {
          setState({
            status: 'error',
            error: `Module ${path} exported neither a default nor a named "${binding}".`,
          });
          return;
        }
        setState({ status: 'loaded', Component: candidate });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof Error ? err.message : String(err);
        setState({ status: 'error', error: message });
      });
    return () => {
      cancelled = true;
    };
  }, [binding, path]);

  if (state.status === 'loading') {
    return <SnippetSkeleton binding={binding} path={path} />;
  }
  if (state.status === 'error') {
    return (
      <ReactSnippetPlaceholder
        binding={binding}
        path={path}
        jsxAttrs={jsxAttrs}
        error={state.error}
      />
    );
  }
  // Errors during the snippet's own render bubble up here. Tiptap's
  // ErrorBoundary doesn't wrap NodeViews, so we render plain — if a snippet
  // throws, the editor surfaces a console error and the card disappears.
  // That's acceptable for a tenant-authored escape hatch.
  const Component = state.Component;
  return <Component {...jsxAttrs} />;
}

/**
 * Animated placeholder shown while a `.tsx` snippet is being compiled +
 * fetched. Sized to roughly match the typical hero/strip dimensions so the
 * page doesn't reflow on swap.
 */
function SnippetSkeleton({ binding, path }: { binding: string; path: string }) {
  return (
    <div
      data-snippet-skeleton=""
      className={cn(
        'relative my-2 flex h-[240px] w-full items-center justify-center overflow-hidden rounded-md border border-border/40 bg-muted/30',
      )}
      role="status"
      aria-busy="true"
      aria-label={`Loading snippet ${binding}`}
    >
      <div
        className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-muted/40 to-transparent"
        aria-hidden
      />
      <div className="relative flex flex-col items-center gap-1 text-xs text-muted-foreground">
        <span className="font-mono">&lt;{binding} /&gt;</span>
        <span>{path}</span>
      </div>
    </div>
  );
}

/**
 * Static fallback card. Shown in non-LOCAL backends (where the snippet's
 * source isn't on the Vite dev server's filesystem) and as the error state
 * when live rendering fails.
 */
function ReactSnippetPlaceholder({
  binding,
  path,
  jsxAttrs,
  error,
}: ReactSnippetSubProps & { error?: string }) {
  return (
    <div
      data-state={error ? 'react-error' : 'react-placeholder'}
      className={cn(
        'rounded-md border border-dashed p-4',
        error ? 'border-destructive/40 bg-destructive/5' : 'border-primary/40 bg-muted/30',
      )}
    >
      <div className="text-sm font-semibold text-foreground/80">
        &lt;{binding} /&gt;
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        React component from{' '}
        <code className="rounded bg-background/60 px-1 py-0.5 font-mono">{path}</code>
        {error ? ' — failed to render in editor:' : '. Renders at build time.'}
      </div>
      {error ? (
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded border border-destructive/30 bg-background/60 p-2 text-xs text-destructive">
          {error}
        </pre>
      ) : null}
      {Object.keys(jsxAttrs).length ? (
        <pre className="mt-2 overflow-x-auto rounded border border-border/40 bg-background/60 p-2 text-xs text-foreground/80">
          {Object.entries(jsxAttrs)
            .map(([k, v]) => `${k}=${formatProp(v)}`)
            .join('  ')}
        </pre>
      ) : null}
    </div>
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
