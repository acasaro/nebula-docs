import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import {
  ChevronDown,
  ChevronRight,
  File as FileIcon,
  Folder,
  GitBranch,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { fetchFileContent, fetchRepoTree } from '@/lib/githubApi';
import { useGitSettings } from '@/lib/gitSettings';
import { buildTree, type TreeNode } from '@/lib/repoTree';

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

function TreeItem({ node, depth, selectedPath, onSelect }: TreeItemProps) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (node.type === 'file') {
    const isSelected = selectedPath === node.fullPath;
    return (
      <button
        type="button"
        onClick={() => onSelect(node.fullPath)}
        className={cn(
          'flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm transition-colors',
          isSelected
            ? 'bg-accent text-accent-foreground font-medium'
            : 'hover:bg-accent/60 text-foreground/80',
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <FileIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate">{node.name}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm text-foreground/80 transition-colors hover:bg-accent/60"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        {expanded ? (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
        )}
        <Folder className="size-3.5 shrink-0 text-muted-foreground" />
        <span className="truncate font-medium">{node.name}</span>
      </button>
      {expanded ? (
        <div>
          {node.children!.map((child) => (
            <TreeItem
              key={child.fullPath}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

interface FileViewerProps {
  path: string | null;
  content: string | null;
  loading: boolean;
  error: string | null;
}

function FileViewer({ path, content, loading, error }: FileViewerProps) {
  if (!path) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
        Pick a file from the tree to preview its MDX.
      </div>
    );
  }
  if (loading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">Loading {path}…</div>
    );
  }
  if (error) {
    return (
      <div className="p-6 text-sm text-destructive">
        Failed to load {path}: {error}
      </div>
    );
  }
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b bg-muted/30 px-4 py-2 text-xs font-mono text-muted-foreground">
        {path}
      </div>
      <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words p-6 font-mono text-xs leading-relaxed text-foreground/90">
        {content}
      </pre>
    </div>
  );
}

export function RepoBrowser() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const settings = useGitSettings();

  const [tree, setTree] = useState<TreeNode[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const active = settings.status === 'ready' ? settings.settings : null;
  const matchesActive =
    active && active.owner === owner && active.repo === repo;

  useEffect(() => {
    if (!active || !matchesActive) return;
    let cancelled = false;
    setTreeLoading(true);
    setTreeError(null);
    fetchRepoTree(active.installationId, active.owner, active.repo, active.defaultBranch)
      .then((result) => {
        if (cancelled) return;
        const mdx = result.paths.filter((p) => p.endsWith('.mdx') || p.endsWith('.md'));
        const built = buildTree(mdx, active.docsSubdirectory ?? '');
        setTree(built);
        setTruncated(result.truncated);
      })
      .catch((err) => {
        if (cancelled) return;
        setTreeError(err instanceof Error ? err.message : 'Failed to load tree.');
      })
      .finally(() => {
        if (!cancelled) setTreeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active, matchesActive]);

  useEffect(() => {
    if (!active || !selectedPath) return;
    let cancelled = false;
    setFileLoading(true);
    setFileError(null);
    setFileContent(null);
    fetchFileContent(
      active.installationId,
      active.owner,
      active.repo,
      selectedPath,
      active.defaultBranch,
    )
      .then(({ content }) => {
        if (cancelled) return;
        setFileContent(content);
      })
      .catch((err) => {
        if (cancelled) return;
        setFileError(err instanceof Error ? err.message : 'Failed to load file.');
      })
      .finally(() => {
        if (!cancelled) setFileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active, selectedPath]);

  const fileCount = useMemo(() => countFiles(tree), [tree]);

  if (settings.status === 'loading') {
    return (
      <div className="-m-8 flex h-[calc(100vh-3.5rem)] items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (settings.status === 'missing' || !active) {
    return <Navigate to="/settings/git" replace />;
  }

  if (!matchesActive) {
    return (
      <div className="-m-8 flex h-[calc(100vh-3.5rem)] items-center justify-center p-8">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Wrong repo</CardTitle>
            <CardDescription>
              Nebula's active repo is{' '}
              <code>
                {active.owner}/{active.repo}
              </code>
              , not <code>{owner}/{repo}</code>. Switch in Git settings to edit a
              different repo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to={`/repo/${active.owner}/${active.repo}`}>
                Open {active.owner}/{active.repo}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="-m-8 flex h-[calc(100vh-3.5rem)] min-h-0">
      <aside className="flex w-72 shrink-0 flex-col overflow-hidden border-r bg-muted/30">
        <div className="border-b px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <GitBranch className="size-3.5 text-primary" />
            {owner}/{repo}
          </div>
          <div className="text-xs text-muted-foreground">
            {active.defaultBranch}
            {active.docsSubdirectory ? (
              <>
                {' · '}
                <code>{active.docsSubdirectory}</code>
              </>
            ) : null}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-1 py-2">
          {treeLoading ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              Loading tree…
            </p>
          ) : treeError ? (
            <p className="px-3 py-2 text-sm text-destructive">{treeError}</p>
          ) : tree.length === 0 ? (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              No MDX files found
              {active.docsSubdirectory ? ` in ${active.docsSubdirectory}` : ''}.
            </p>
          ) : (
            tree.map((node) => (
              <TreeItem
                key={node.fullPath}
                node={node}
                depth={0}
                selectedPath={selectedPath}
                onSelect={setSelectedPath}
              />
            ))
          )}
        </div>
        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          {fileCount} MDX file{fileCount === 1 ? '' : 's'}
          {truncated ? ' · tree truncated' : ''}
        </div>
      </aside>
      <main className="flex-1 overflow-hidden bg-background">
        <FileViewer
          path={selectedPath}
          content={fileContent}
          loading={fileLoading}
          error={fileError}
        />
      </main>
    </div>
  );
}

function countFiles(nodes: TreeNode[]): number {
  let n = 0;
  for (const node of nodes) {
    if (node.type === 'file') n++;
    else if (node.children) n += countFiles(node.children);
  }
  return n;
}
