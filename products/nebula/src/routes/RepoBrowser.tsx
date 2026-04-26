import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router';
import {
  ChevronDown,
  ChevronRight,
  Code2,
  Eye,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BranchPicker } from '@/components/BranchPicker';
import { FileTypeIcon, isBinaryFile } from '@/components/FileTypeIcon';
import { MdxEditor, normalizeMdx } from '@/components/mdx/MdxEditor';
import { cn } from '@/lib/utils';
import {
  commitFiles,
  createBranch,
  fetchFileContent,
  fetchRepoTree,
  listBranches,
} from '@/lib/githubApi';
import { useGitSettings } from '@/lib/gitSettings';
import { buildTree, type TreeNode } from '@/lib/repoTree';

interface FileEntry {
  /** Canonical content from GitHub, normalized through the MDX serializer
   * so the editor's first emission won't mark the file dirty on load. */
  original: string;
  /** Latest editor output. Equals `original` when the file is clean. */
  draft: string;
  sha: string;
}

function isMdxFile(name: string): boolean {
  return name.endsWith('.mdx') || name.endsWith('.md');
}

type ViewMode = 'visual' | 'source';

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  hideExtensions?: boolean;
}

function TreeItem({
  node,
  depth,
  selectedPath,
  onSelect,
  hideExtensions = false,
}: TreeItemProps) {
  const [expanded, setExpanded] = useState(depth < 2);

  if (node.type === 'file') {
    const isSelected = selectedPath === node.fullPath;
    const display = hideExtensions ? stripExtension(node.name) : node.name;
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
        <FileTypeIcon name={node.name} />
        <span className="truncate">{display}</span>
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
              hideExtensions={hideExtensions}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function stripExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx > 0 ? name.slice(0, idx) : name;
}

interface FileHeaderProps {
  path: string;
  mode: ViewMode | null;
  onModeChange?: (mode: ViewMode) => void;
  dirty?: boolean;
}

function FileHeader({ path, mode, onModeChange, dirty }: FileHeaderProps) {
  return (
    <div className="flex h-10 items-center justify-between gap-3 border-b bg-muted/30 px-4 text-xs font-mono text-muted-foreground">
      <span className="truncate">
        {path}
        {dirty ? <span className="ml-2 text-amber-500" aria-label="unsaved">●</span> : null}
      </span>
      {mode && onModeChange ? (
        <div className="flex items-center gap-0.5 rounded-md border bg-background p-0.5">
          <ModeButton
            active={mode === 'visual'}
            onClick={() => onModeChange('visual')}
            icon={<Eye className="size-3.5" />}
            label="Visual"
          />
          <ModeButton
            active={mode === 'source'}
            onClick={() => onModeChange('source')}
            icon={<Code2 className="size-3.5" />}
            label="Source"
          />
        </div>
      ) : null}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1 rounded-sm px-2 py-1 font-sans text-xs transition-colors',
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:text-foreground',
      )}
      aria-pressed={active}
    >
      {icon}
      {label}
    </button>
  );
}

interface FileViewerProps {
  path: string | null;
  content: string | null;
  loading: boolean;
  error: string | null;
  mode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  onContentChange?: (next: string) => void;
  dirty?: boolean;
}

function FileViewer({
  path,
  content,
  loading,
  error,
  mode,
  onModeChange,
  onContentChange,
  dirty,
}: FileViewerProps) {
  if (!path) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
        Pick a file from the tree to open it.
      </div>
    );
  }
  if (loading) {
    return <div className="p-6 text-sm text-muted-foreground">Loading {path}…</div>;
  }
  if (error) {
    return (
      <div className="p-6 text-sm text-destructive">
        Failed to load {path}: {error}
      </div>
    );
  }
  if (content === null && isBinaryFile(path)) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <FileHeader path={path} mode={null} />
        <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
          Binary file — preview not available.
        </div>
      </div>
    );
  }
  if (content === null) return null;

  if (isMdxFile(path)) {
    return (
      <div className="flex h-full min-h-0 flex-col">
        <FileHeader path={path} mode={mode} onModeChange={onModeChange} dirty={dirty} />
        {mode === 'visual' ? (
          <div className="flex-1 overflow-auto bg-background">
            <MdxEditor
              key={path}
              source={content}
              onSourceChange={onContentChange}
            />
          </div>
        ) : (
          <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words p-6 font-mono text-xs leading-relaxed text-foreground/90">
            {content}
          </pre>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <FileHeader path={path} mode={null} />
      <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words p-6 font-mono text-xs leading-relaxed text-foreground/90">
        {content}
      </pre>
    </div>
  );
}

interface FileTreePanelProps {
  tree: TreeNode[];
  loading: boolean;
  error: string | null;
  emptyMessage: string;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  hideExtensions?: boolean;
}

function FileTreePanel({
  tree,
  loading,
  error,
  emptyMessage,
  selectedPath,
  onSelect,
  hideExtensions,
}: FileTreePanelProps) {
  if (loading) {
    return <p className="px-3 py-2 text-sm text-muted-foreground">Loading tree…</p>;
  }
  if (error) {
    return <p className="px-3 py-2 text-sm text-destructive">{error}</p>;
  }
  if (tree.length === 0) {
    return <p className="px-3 py-2 text-sm text-muted-foreground">{emptyMessage}</p>;
  }
  return (
    <div className="px-1 py-2">
      {tree.map((node) => (
        <TreeItem
          key={node.fullPath}
          node={node}
          depth={0}
          selectedPath={selectedPath}
          onSelect={onSelect}
          hideExtensions={hideExtensions}
        />
      ))}
    </div>
  );
}

export function RepoBrowser() {
  const { owner, repo } = useParams<{ owner: string; repo: string }>();
  const settings = useGitSettings();

  const [allPaths, setAllPaths] = useState<string[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);

  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [files, setFiles] = useState<Record<string, FileEntry>>({});
  const fetchedPathsRef = useRef<Set<string>>(new Set());
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>('visual');

  const [currentBranch, setCurrentBranch] = useState<string | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const currentEntry = selectedPath ? (files[selectedPath] ?? null) : null;
  const dirtyPaths = useMemo(
    () =>
      Object.entries(files)
        .filter(([, entry]) => entry.original !== entry.draft)
        .map(([path]) => path),
    [files],
  );
  const isCurrentDirty = currentEntry
    ? currentEntry.original !== currentEntry.draft
    : false;

  const active = settings.status === 'ready' ? settings.settings : null;
  const matchesActive = active && active.owner === owner && active.repo === repo;

  useEffect(() => {
    if (!active || !matchesActive) return;
    if (currentBranch === null) setCurrentBranch(active.defaultBranch);
  }, [active, matchesActive, currentBranch]);

  useEffect(() => {
    if (!active || !matchesActive || !currentBranch) return;
    let cancelled = false;
    setTreeLoading(true);
    setTreeError(null);
    fetchRepoTree(active.installationId, active.owner, active.repo, currentBranch)
      .then((result) => {
        if (cancelled) return;
        setAllPaths(result.paths);
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
  }, [active, matchesActive, currentBranch]);

  useEffect(() => {
    if (!active || !matchesActive) return;
    let cancelled = false;
    setBranchesLoading(true);
    listBranches(active.installationId, active.owner, active.repo)
      .then((list) => {
        if (cancelled) return;
        setBranches(list);
      })
      .catch(() => {
        if (cancelled) return;
        // Fall back to just the default branch on failure.
        setBranches([active.defaultBranch]);
      })
      .finally(() => {
        if (!cancelled) setBranchesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active, matchesActive]);

  useEffect(() => {
    if (!active || !selectedPath || !currentBranch) return;
    if (isBinaryFile(selectedPath)) {
      setFileLoading(false);
      setFileError(null);
      return;
    }
    if (fetchedPathsRef.current.has(selectedPath)) {
      setFileLoading(false);
      setFileError(null);
      return;
    }
    fetchedPathsRef.current.add(selectedPath);
    let cancelled = false;
    setFileLoading(true);
    setFileError(null);
    fetchFileContent(
      active.installationId,
      active.owner,
      active.repo,
      selectedPath,
      currentBranch,
    )
      .then(({ content, sha }) => {
        if (cancelled) return;
        const normalized = isMdxFile(selectedPath)
          ? normalizeMdx(content)
          : content;
        setFiles((prev) => ({
          ...prev,
          [selectedPath]: { original: normalized, draft: normalized, sha },
        }));
      })
      .catch((err) => {
        if (cancelled) return;
        fetchedPathsRef.current.delete(selectedPath);
        setFileError(err instanceof Error ? err.message : 'Failed to load file.');
      })
      .finally(() => {
        if (!cancelled) setFileLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active, selectedPath, currentBranch]);

  const handleContentChange = (next: string) => {
    if (!selectedPath) return;
    setFiles((prev) => {
      const entry = prev[selectedPath];
      if (!entry) return prev;
      if (entry.draft === next) return prev;
      return { ...prev, [selectedPath]: { ...entry, draft: next } };
    });
  };

  const handleSwitchBranch = (branch: string) => {
    if (!active) return;
    setCurrentBranch(branch);
    // Drop cached file content — same path may differ between branches.
    setFiles({});
    fetchedPathsRef.current = new Set();
    setSaveMessage(null);
  };

  const handleCreateBranch = async (
    name: string,
    base: string,
    bringChanges: boolean,
  ) => {
    if (!active) return;
    await createBranch(active.installationId, active.owner, active.repo, base, name);
    setBranches((prev) => (prev.includes(name) ? prev : [...prev, name].sort()));
    setCurrentBranch(name);
    if (!bringChanges) {
      // Drop in-progress drafts so they stay on the prior branch.
      setFiles({});
      fetchedPathsRef.current = new Set();
    }
    // If bringChanges is true, dirty file drafts ride along — they're
    // already in our `files` map and will commit to the new branch.
    setSaveMessage(null);
  };

  const handleSaveInBranch = async () => {
    if (!active || !currentBranch || dirtyPaths.length === 0) return;
    setSaving(true);
    setSaveMessage(null);
    try {
      const changes: Array<{ path: string; content: string }> = [];
      for (const path of dirtyPaths) {
        const entry = files[path];
        if (entry) changes.push({ path, content: entry.draft });
      }
      if (changes.length === 0) return;
      const message =
        changes.length === 1
          ? `Update ${changes[0]!.path}`
          : `Update ${changes.length} files`;
      await commitFiles(
        active.installationId,
        active.owner,
        active.repo,
        currentBranch,
        changes,
        message,
      );
      // Mark all committed files as clean by aligning original to draft.
      setFiles((prev) => {
        const next: Record<string, FileEntry> = { ...prev };
        for (const change of changes) {
          const entry = next[change.path];
          if (entry) next[change.path] = { ...entry, original: change.content };
        }
        return next;
      });
      setSaveMessage(`Saved ${changes.length} file${changes.length === 1 ? '' : 's'} to ${currentBranch}.`);
    } catch (err) {
      setSaveMessage(
        err instanceof Error ? `Save failed: ${err.message}` : 'Save failed.',
      );
    } finally {
      setSaving(false);
    }
  };

  const onDefaultBranch = currentBranch === active?.defaultBranch;

  const subdir = active?.docsSubdirectory ?? '';

  const filesTree = useMemo(() => buildTree(allPaths, subdir), [allPaths, subdir]);
  const navigationTree = useMemo(() => {
    const docs = allPaths.filter((p) => p.endsWith('.mdx') || p.endsWith('.md'));
    return buildTree(docs, subdir);
  }, [allPaths, subdir]);

  const filesCount = useMemo(() => countFiles(filesTree), [filesTree]);
  const navCount = useMemo(() => countFiles(navigationTree), [navigationTree]);

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
        <div className="flex flex-col gap-2 border-b px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <GitBranch className="size-3.5 text-primary" />
            {owner}/{repo}
          </div>
          <BranchPicker
            currentBranch={currentBranch ?? active.defaultBranch}
            defaultBranch={active.defaultBranch}
            branches={branches}
            loading={branchesLoading}
            hasDirty={dirtyPaths.length > 0}
            onSwitch={handleSwitchBranch}
            onCreate={handleCreateBranch}
          />
          {active.docsSubdirectory ? (
            <div className="text-xs text-muted-foreground">
              <code>{active.docsSubdirectory}</code>
            </div>
          ) : null}
        </div>

        <Tabs defaultValue="navigation" className="flex flex-1 flex-col overflow-hidden">
          <TabsList className="mx-3 mt-2 grid w-auto grid-cols-2">
            <TabsTrigger value="navigation">Navigation</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>
          <TabsContent
            value="navigation"
            className="flex-1 overflow-y-auto"
          >
            <FileTreePanel
              tree={navigationTree}
              loading={treeLoading}
              error={treeError}
              emptyMessage={`No MDX files found${subdir ? ` in ${subdir}` : ''}.`}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
              hideExtensions
            />
          </TabsContent>
          <TabsContent
            value="files"
            className="flex-1 overflow-y-auto"
          >
            <FileTreePanel
              tree={filesTree}
              loading={treeLoading}
              error={treeError}
              emptyMessage={`No files found${subdir ? ` in ${subdir}` : ''}.`}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
            />
          </TabsContent>
        </Tabs>

        <div className="flex flex-col gap-2 border-t px-4 py-3 text-xs text-muted-foreground">
          {dirtyPaths.length > 0 ? (
            <>
              <div className="flex items-center gap-1.5 text-amber-500">
                <span aria-hidden>●</span>
                {dirtyPaths.length} unsaved change
                {dirtyPaths.length === 1 ? '' : 's'}
              </div>
              {onDefaultBranch ? (
                <p className="text-[11px] leading-tight">
                  Create a branch off{' '}
                  <code className="font-mono">{active.defaultBranch}</code> to
                  save your changes.
                </p>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  className="h-8 w-full"
                  disabled={saving}
                  onClick={handleSaveInBranch}
                >
                  {saving ? 'Saving…' : `Save in ${currentBranch}`}
                </Button>
              )}
            </>
          ) : null}
          {saveMessage ? (
            <p
              className={cn(
                'text-[11px] leading-tight',
                saveMessage.startsWith('Save failed')
                  ? 'text-destructive'
                  : 'text-emerald-500',
              )}
            >
              {saveMessage}
            </p>
          ) : null}
          <div>
            {navCount} doc{navCount === 1 ? '' : 's'} · {filesCount} file
            {filesCount === 1 ? '' : 's'}
            {truncated ? ' · tree truncated' : ''}
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-hidden bg-background">
        <FileViewer
          path={selectedPath}
          content={currentEntry?.draft ?? null}
          loading={fileLoading}
          error={fileError}
          mode={mode}
          onModeChange={setMode}
          onContentChange={handleContentChange}
          dirty={isCurrentDirty}
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
