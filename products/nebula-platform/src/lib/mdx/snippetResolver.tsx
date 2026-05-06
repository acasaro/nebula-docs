import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * Resolves `<Snippet file="x" />` to its raw MDX content. Returning
 * `undefined` means the snippet hasn't been fetched yet (or doesn't exist) —
 * consumers render a "Snippet not found" placeholder until the cache fills
 * in.
 *
 * The resolver's input is the raw `file` attribute as written in source
 * (`"disclaimer"` or `"shared/legal"`). The implementation is responsible
 * for mapping that to the on-disk path and stripping/appending `.mdx`.
 */
export type ResolveSnippet = (file: string) => string | undefined;

/**
 * Map a raw `file` attribute to its repo-root-relative path
 * (`"disclaimer"` → `"content/snippets/disclaimer.mdx"`). Used by the
 * NodeView's "open source" affordance.
 */
export type ResolveSnippetPath = (file: string) => string;

interface SnippetResolverValue {
  resolveContent: ResolveSnippet;
  resolvePath: ResolveSnippetPath;
}

const NULL_VALUE: SnippetResolverValue = {
  resolveContent: () => undefined,
  resolvePath: (file) => `content/snippets/${file}.mdx`,
};

const SnippetResolverContext = createContext<SnippetResolverValue>(NULL_VALUE);

interface SnippetResolverProviderProps {
  resolveContent: ResolveSnippet;
  resolvePath: ResolveSnippetPath;
  children: ReactNode;
}

export function SnippetResolverProvider({
  resolveContent,
  resolvePath,
  children,
}: SnippetResolverProviderProps) {
  // Re-key the context value on the resolver pair so consumers re-render
  // when either changes (e.g. a snippet just loaded, or the user switched
  // branches).
  const value = useMemo(
    () => ({ resolveContent, resolvePath }),
    [resolveContent, resolvePath],
  );
  return (
    <SnippetResolverContext.Provider value={value}>
      {children}
    </SnippetResolverContext.Provider>
  );
}

/**
 * Read the resolved MDX content of a snippet. Returns `undefined` if the
 * snippet hasn't loaded yet or doesn't exist — the consumer should render a
 * placeholder in that case.
 */
export function useSnippetContent(file: string): string | undefined {
  return useContext(SnippetResolverContext).resolveContent(file);
}

/**
 * Repo-root-relative path for the snippet file. Stable across renders so it
 * can drive a navigation link.
 */
export function useSnippetPath(file: string): string {
  return useContext(SnippetResolverContext).resolvePath(file);
}
