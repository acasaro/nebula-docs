import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router';
import {
  ChevronDown,
  ChevronRight,
  Code2,
  Eye,
  Folder,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BranchPicker } from '@/components/BranchPicker';
import { FileTypeIcon, isBinaryFile } from '@/components/FileTypeIcon';
import { useHeaderLeading, useHeaderSlot } from '@/components/HeaderSlot';
import { MdxEditor, normalizeMdx } from '@/components/mdx/MdxEditor';
import { PublishMenu, type PublishChange } from '@/components/PublishMenu';
import { cn } from '@/lib/utils';
import {
  commitFiles,
  createBranch,
  createPullRequest,
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
  /** Bumped on revert so the editor remounts and picks up `original`. */
  revertNonce: number;
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
  const [expanded, setExpanded] = useState(false);

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
    <div className="flex flex-1 items-center justify-between gap-3 min-w-0 text-xs font-mono text-muted-foreground">
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
  revertNonce: number;
  loading: boolean;
  error: string | null;
  mode: ViewMode;
  onContentChange?: (next: string) => void;
}

function FileViewer({
  path,
  content,
  revertNonce,
  loading,
  error,
  mode,
  onContentChange,
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
      <div className="flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground">
        Binary file — preview not available.
      </div>
    );
  }
  if (content === null) return null;

  if (isMdxFile(path)) {
    return mode === 'visual' ? (
      <div className="flex-1 overflow-auto bg-background">
        <MdxEditor
          key={`${path}:${revertNonce}`}
          source={content}
          onSourceChange={onContentChange}
        />
      </div>
    ) : (
      <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words p-6 font-mono text-xs leading-relaxed text-foreground/90">
        {content}
      </pre>
    );
  }

  return (
    <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words p-6 font-mono text-xs leading-relaxed text-foreground/90">
      {content}
    </pre>
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
    <div className="px-3 py-2">
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
  const params = useParams();
  const navigate = useNavigate();
  const settings = useGitSettings();

  const branchParam = (params.branch as string | undefined) ?? null;
  const splatPath = (params['*'] as string | undefined) ?? '';
  const selectedPath = splatPath || null;

  const [allPaths, setAllPaths] = useState<string[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);

  const [files, setFiles] = useState<Record<string, FileEntry>>({});
  const fetchedPathsRef = useRef<Set<string>>(new Set());
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>('visual');

  const currentBranch = branchParam;
  const [branches, setBranches] = useState<string[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingPr, setCreatingPr] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Drop file caches when branch changes — same path may differ between branches.
  const lastBranchRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastBranchRef.current !== null && lastBranchRef.current !== currentBranch) {
      setFiles({});
      fetchedPathsRef.current = new Set();
      setSaveMessage(null);
    }
    lastBranchRef.current = currentBranch;
  }, [currentBranch]);

  const handleSelectPath = useCallback(
    (path: string) => {
      if (!currentBranch) return;
      navigate(`/editor/${currentBranch}/~/${path}`);
    },
    [currentBranch, navigate],
  );

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
  const matchesActive = !!active;

  useEffect(() => {
    if (!active || !currentBranch) return;
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
          [selectedPath]: { original: normalized, draft: normalized, sha, revertNonce: 0 },
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

  const handleRevert = (path: string) => {
    setFiles((prev) => {
      const entry = prev[path];
      if (!entry) return prev;
      if (entry.original === entry.draft) return prev;
      return {
        ...prev,
        [path]: {
          ...entry,
          draft: entry.original,
          revertNonce: entry.revertNonce + 1,
        },
      };
    });
  };

  const handleRevertAll = () => {
    setFiles((prev) => {
      const next: Record<string, FileEntry> = { ...prev };
      let changed = false;
      for (const [path, entry] of Object.entries(prev)) {
        if (entry.original === entry.draft) continue;
        next[path] = {
          ...entry,
          draft: entry.original,
          revertNonce: entry.revertNonce + 1,
        };
        changed = true;
      }
      return changed ? next : prev;
    });
  };

  const navigateToBranch = (nextBranch: string, keepPath: boolean) => {
    if (keepPath && selectedPath) {
      navigate(`/editor/${nextBranch}/~/${selectedPath}`);
    } else {
      navigate(`/editor/${nextBranch}`);
    }
  };

  const handleSwitchBranch = (branch: string) => {
    if (!active) return;
    navigateToBranch(branch, true);
  };

  const handleCreateBranch = async (
    name: string,
    base: string,
    bringChanges: boolean,
  ) => {
    if (!active) return;
    await createBranch(active.installationId, active.owner, active.repo, base, name);
    setBranches((prev) => (prev.includes(name) ? prev : [...prev, name].sort()));
    if (bringChanges) {
      // Dirty file drafts ride along — they're in our `files` map and will
      // commit to the new branch when navigation lands there.
    }
    navigateToBranch(name, true);
  };

  const handleSave = async () => {
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
      setFiles((prev) => {
        const next: Record<string, FileEntry> = { ...prev };
        for (const change of changes) {
          const entry = next[change.path];
          if (entry) next[change.path] = { ...entry, original: change.content };
        }
        return next;
      });
      setSaveMessage(
        `Saved ${changes.length} file${changes.length === 1 ? '' : 's'} to ${currentBranch}.`,
      );
    } catch (err) {
      setSaveMessage(
        err instanceof Error ? `Save failed: ${err.message}` : 'Save failed.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePr = async (title: string, body: string) => {
    if (!active || !currentBranch) return;
    setCreatingPr(true);
    setSaveMessage(null);
    try {
      // Auto-save any pending dirty drafts onto the branch first so the PR
      // includes them. Skipping save here would open a PR that's missing
      // in-progress work.
      if (dirtyPaths.length > 0) await handleSave();
      const { number, url } = await createPullRequest(
        active.installationId,
        active.owner,
        active.repo,
        currentBranch,
        active.defaultBranch,
        title,
        body,
      );
      setSaveMessage(`Opened PR #${number}: ${url}`);
    } catch (err) {
      const detail = err instanceof Error ? err.message : 'Failed to create PR.';
      setSaveMessage(`PR failed: ${detail}`);
      throw err instanceof Error ? err : new Error(detail);
    } finally {
      setCreatingPr(false);
    }
  };

  const publishChanges = useMemo<PublishChange[]>(
    () => dirtyPaths.map((path) => ({ path, status: 'modified' as const })),
    [dirtyPaths],
  );

  const headerSlot = useMemo(() => {
    const fileNode = selectedPath ? (
      <FileHeader
        path={selectedPath}
        mode={isMdxFile(selectedPath) ? mode : null}
        onModeChange={isMdxFile(selectedPath) ? setMode : undefined}
        dirty={isCurrentDirty}
      />
    ) : (
      <div className="flex-1" />
    );
    if (!active || !currentBranch) return fileNode;
    return (
      <>
        {fileNode}
        <PublishMenu
          currentBranch={currentBranch}
          defaultBranch={active.defaultBranch}
          changes={publishChanges}
          saving={saving}
          creatingPr={creatingPr}
          message={saveMessage}
          onSave={handleSave}
          onCreatePr={handleCreatePr}
          onRevert={handleRevert}
          onRevertAll={handleRevertAll}
        />
      </>
    );
    // handleSave / handleCreatePr close over current state but are
    // re-derived each render; including them as deps would re-run the
    // memo on every keystroke. The deps below cover the actual inputs
    // those handlers read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedPath,
    mode,
    isCurrentDirty,
    active,
    currentBranch,
    publishChanges,
    saving,
    creatingPr,
    saveMessage,
  ]);
  useHeaderSlot(headerSlot);

  const headerLeading = useMemo(() => {
    if (!active || !currentBranch) return null;
    return (
      <BranchPicker
        currentBranch={currentBranch}
        defaultBranch={active.defaultBranch}
        branches={branches}
        loading={branchesLoading}
        hasDirty={dirtyPaths.length > 0}
        onSwitch={handleSwitchBranch}
        onCreate={handleCreateBranch}
      />
    );
    // handleSwitchBranch / handleCreateBranch close over current state but
    // are re-derived each render; including them as deps would re-run the
    // memo and rebuild the BranchPicker subtree on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    active,
    currentBranch,
    branches,
    branchesLoading,
    dirtyPaths.length,
  ]);
  useHeaderLeading(headerLeading);

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

  return (
    <div className="-m-8 flex h-[calc(100vh-3.5rem)] min-h-0">
      <aside className="flex w-72 shrink-0 flex-col overflow-hidden border-r bg-muted/30">
        {active.docsSubdirectory ? (
          <div className="border-b border-border/40 px-4 py-2 text-xs text-muted-foreground">
            <code>{active.docsSubdirectory}</code>
          </div>
        ) : null}

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
              onSelect={handleSelectPath}
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
              onSelect={handleSelectPath}
            />
          </TabsContent>
        </Tabs>

        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          {navCount} doc{navCount === 1 ? '' : 's'} · {filesCount} file
          {filesCount === 1 ? '' : 's'}
          {truncated ? ' · tree truncated' : ''}
        </div>
      </aside>
      <main className="flex flex-1 flex-col overflow-hidden bg-background">
        <FileViewer
          path={selectedPath}
          content={currentEntry?.draft ?? null}
          revertNonce={currentEntry?.revertNonce ?? 0}
          loading={fileLoading}
          error={fileError}
          mode={mode}
          onContentChange={handleContentChange}
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
