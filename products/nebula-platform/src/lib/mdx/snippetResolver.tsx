import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * Resolves an import path (the value after `from` in an MDX `import`
 * statement) to the raw source of the referenced snippet file. The path is
 * passed verbatim from MDX (`/snippets/disclaimer.mdx`,
 * `../shared/legal.mdx`, etc.); the resolver implementation is responsible
 * for mapping that to a repo-relative path and reading from the loaded
 * files map.
 *
 * Returns `undefined` when the snippet hasn't been fetched yet or doesn't
 * exist — the consumer renders a placeholder until the cache fills in.
 */
export type ResolveSnippetPath = (importPath: string) => string | undefined;

/** Repo-root-relative path for the snippet file (used by the editor to
 *  navigate to the snippet source via the "open source" affordance). */
export type RepoPathForImport = (importPath: string) => string;

/** Available snippet entries surfaced to the slash-command picker. */
export interface SnippetCatalogEntry {
  /** The path to write into the import statement (`/snippets/foo.mdx`). */
  importPath: string;
  /** Repo-root-relative path for navigation. */
  repoPath: string;
  /** Suggested PascalCase binding name derived from the file stem. */
  defaultBinding: string;
  /** True if the file ends in `.jsx` / `.tsx` (React component snippet). */
  isReact: boolean;
}

interface SnippetResolverValue {
  resolveContent: ResolveSnippetPath;
  resolveRepoPath: RepoPathForImport;
  catalog: readonly SnippetCatalogEntry[];
}

const NULL_VALUE: SnippetResolverValue = {
  resolveContent: () => undefined,
  resolveRepoPath: (p) => p.replace(/^\/+/, ''),
  catalog: [],
};

const SnippetResolverContext = createContext<SnippetResolverValue>(NULL_VALUE);

interface SnippetResolverProviderProps {
  resolveContent: ResolveSnippetPath;
  resolveRepoPath: RepoPathForImport;
  catalog: readonly SnippetCatalogEntry[];
  children: ReactNode;
}

export function SnippetResolverProvider({
  resolveContent,
  resolveRepoPath,
  catalog,
  children,
}: SnippetResolverProviderProps) {
  const value = useMemo(
    () => ({ resolveContent, resolveRepoPath, catalog }),
    [resolveContent, resolveRepoPath, catalog],
  );
  return (
    <SnippetResolverContext.Provider value={value}>
      {children}
    </SnippetResolverContext.Provider>
  );
}

/** Read the resolved MDX/MD source for a snippet path. */
export function useSnippetContent(importPath: string): string | undefined {
  return useContext(SnippetResolverContext).resolveContent(importPath);
}

/** Repo-root-relative path the "open source" affordance should navigate to. */
export function useSnippetRepoPath(importPath: string): string {
  return useContext(SnippetResolverContext).resolveRepoPath(importPath);
}

/** Catalog of available snippets for the slash-command picker. */
export function useSnippetCatalog(): readonly SnippetCatalogEntry[] {
  return useContext(SnippetResolverContext).catalog;
}
