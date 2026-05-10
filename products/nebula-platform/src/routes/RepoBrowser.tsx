import { BranchPicker } from "@/components/BranchPicker";
import { ConfigurationsPanel } from "@/components/ConfigurationsPanel";
import { EditorSurfaceSkeleton } from "@/components/EditorSurfaceSkeleton";
import { FileTreeSkeleton } from "@/components/FileTreeSkeleton";
import { FileTypeIcon, isBinaryFile } from "@/components/FileTypeIcon";
import { useHeaderLeading, useHeaderSlot } from "@/components/HeaderSlot";
import { MdxEditor, normalizeMdx } from "@/components/mdx/MdxEditor";
import { HoverProvider, type DropSide, type HoverState } from "@/components/NavDnd";
import { NavSettingsPanel } from "@/components/NavSettingsPanel";
import { NavTree, type AddEntryKind, type OpenNavSettings } from "@/components/NavTree";
import { NavTreeSkeleton } from "@/components/NavTreeSkeleton";
import { ORPHAN_ID_PREFIX, OrphanedPages } from "@/components/OrphanedPages";
import { PreviewButton } from "@/components/PreviewButton";
import { PublishMenu, type PublishChange } from "@/components/PublishMenu";
import { SourceEditor, languageForPath } from "@/components/SourceEditor";
import { PageLoader } from "@/components/ui/PageLoader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  commitFiles,
  createBranch,
  createPullRequest,
  fetchFileContent,
  fetchRepoTree,
  listBranches,
  type FileChange,
} from "@/lib/content";
import {
  buildPageEntryResolver,
  filePathToPageSlug,
  firstReachablePage,
  referencedPages,
  useDocsConfig,
  type DocsConfig,
  type Group,
  type PageEntry,
  type Tab,
} from "@/lib/docsConfig";
import {
  addressOfEntry,
  appendAnchor,
  appendDropdown,
  appendTab,
  appendToGroup,
  appendToTab,
  deleteEntry,
  findEntry,
  insertEntryAt,
  moveEntryToAddress,
  reorderTabs,
  type DocsInsertAddress,
  type ResolveContext,
} from "@/lib/docsConfigOps";
import { loadDrafts, makeDraftScopeKey, saveDrafts } from "@/lib/draftStore";
import { applyFrontmatterPatch } from "@/lib/frontmatter";
import { useFrontmatterCache } from "@/lib/frontmatterCache";
import { useGitSettings } from "@/lib/gitSettings";
import { SnippetResolverProvider } from "@/lib/mdx/snippetResolver";
import { buildTree, type TreeNode } from "@/lib/repoTree";
import {
  buildRepoPathResolver,
  buildSnippetResolver,
  useSnippetCatalog,
  useSnippetPrefetch,
  type SnippetCacheEntry,
} from "@/lib/snippetCache";
import { useThemeConfig, type ThemeConfig } from "@/lib/themeConfig";
import { EDITOR_NAV_MAX, EDITOR_NAV_MIN, useEditorNavWidth } from "@/lib/uiPrefs";
import { cn } from "@/lib/utils";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { getThemeById } from "@nebula-docs/theme";
import { ChevronDown, ChevronRight, Code2, Eye, Files, Folder, Map, Settings } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { toast } from "sonner";

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
  return name.endsWith(".mdx") || name.endsWith(".md");
}

// GitHub-convention repo metadata files at the repo root. They render as
// markdown but aren't docs pages, so they shouldn't surface as orphans. A
// nested `content/api/README.md` (folder index pattern) is intentionally not
// matched — those still belong in the orphan list until wired into nav.
const REPO_METADATA_AT_ROOT =
  /^(README|LICENSE|CHANGELOG|CONTRIBUTING|CODE_OF_CONDUCT)\.mdx?$/i;

/**
 * Convert a tab's display name into the slug fragment we auto-prefix new
 * pages with. Lowercases, swaps any run of non-alphanumerics for `-`, and
 * trims leading/trailing dashes — same shape Mintlify's editor uses when
 * seeding a page slug from a tab name (e.g. "API Reference" → "api-reference",
 * "Developers" → "developers", "About " → "about").
 */
function slugifyTabName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type ViewMode = "visual" | "source";

interface TreeItemProps {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  hideExtensions?: boolean;
}

function TreeItem({ node, depth, selectedPath, onSelect, hideExtensions = false }: TreeItemProps) {
  const [expanded, setExpanded] = useState(false);

  if (node.type === "file") {
    const isSelected = selectedPath === node.fullPath;
    const display = hideExtensions ? stripExtension(node.name) : node.name;
    return (
      <button
        type='button'
        onClick={() => onSelect(node.fullPath)}
        className={cn(
          "flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm transition-colors",
          isSelected
            ? "bg-accent text-accent-foreground font-medium"
            : "hover:bg-accent/60 text-foreground/80",
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}>
        <FileTypeIcon name={node.name} />
        <span className='truncate'>{display}</span>
      </button>
    );
  }

  return (
    <div>
      <button
        type='button'
        onClick={() => setExpanded((e) => !e)}
        className='flex w-full items-center gap-1.5 rounded-md px-2 py-1 text-left text-sm text-foreground/80 transition-colors hover:bg-accent/60'
        style={{ paddingLeft: `${depth * 12 + 4}px` }}>
        {expanded ? (
          <ChevronDown className='size-3.5 shrink-0 text-muted-foreground' />
        ) : (
          <ChevronRight className='size-3.5 shrink-0 text-muted-foreground' />
        )}
        <Folder className='size-3.5 shrink-0 text-muted-foreground' />
        <span className='truncate font-medium'>{node.name}</span>
      </button>
      {expanded ? (
        <div className='mt-0.5 flex flex-col gap-0.5'>
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
  const idx = name.lastIndexOf(".");
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
    <div className='flex flex-1 items-center gap-3 min-w-0 text-xs font-mono text-muted-foreground'>
      {mode && onModeChange ? (
        <div className='flex shrink-0 items-center gap-0.5 rounded-md border bg-background p-0.5'>
          <ModeButton
            active={mode === "visual"}
            onClick={() => onModeChange("visual")}
            icon={<Eye className='size-3.5' />}
            label='Visual'
          />
          <ModeButton
            active={mode === "source"}
            onClick={() => onModeChange("source")}
            icon={<Code2 className='size-3.5' />}
            label='Source'
          />
        </div>
      ) : null}
      <span className='truncate'>
        {path}
        {dirty ? (
          <span className='ml-2 text-amber-500' aria-label='unsaved'>
            ●
          </span>
        ) : null}
      </span>
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
      type='button'
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={cn(
        "flex size-7 items-center justify-center rounded-md transition-colors",
        active ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground",
      )}>
      {icon}
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
      <div className='flex h-full items-center justify-center p-8 text-sm text-muted-foreground'>
        Pick a file from the tree to open it.
      </div>
    );
  }
  if (loading) {
    return <EditorSurfaceSkeleton />;
  }
  if (error) {
    return (
      <div className='p-6 text-sm text-destructive'>
        Failed to load {path}: {error}
      </div>
    );
  }
  if (content === null && isBinaryFile(path)) {
    return (
      <div className='flex flex-1 items-center justify-center p-8 text-sm text-muted-foreground'>
        Binary file — preview not available.
      </div>
    );
  }
  if (content === null) return null;

  if (isMdxFile(path)) {
    return mode === "visual" ? (
      <div className='flex-1 overflow-auto bg-background'>
        <MdxEditor
          key={`${path}:${revertNonce}`}
          source={content}
          onSourceChange={onContentChange}
        />
      </div>
    ) : (
      <SourceEditor
        key={`${path}:${revertNonce}`}
        value={content}
        language='mdx'
        onChange={onContentChange}
        className='flex-1'
      />
    );
  }

  // Non-MDX text files (json, yaml, ts, css, etc.) — same SourceEditor with
  // language inferred from the path, so config files and tenant-local
  // components edit with full syntax highlighting + a numbered gutter.
  // `onChange` is wired the same way as MDX so dirty-tracking + the
  // PublishMenu pipeline carry these edits through to commit unchanged.
  return (
    <SourceEditor
      key={`${path}:${revertNonce}`}
      value={content}
      language={languageForPath(path)}
      onChange={onContentChange}
      className='flex-1'
    />
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
    return <FileTreeSkeleton />;
  }
  if (error) {
    return <p className='px-3 py-2 text-sm text-destructive'>{error}</p>;
  }
  if (tree.length === 0) {
    return <p className='px-3 py-2 text-sm text-muted-foreground'>{emptyMessage}</p>;
  }
  return (
    <div className='flex flex-col gap-0.5 px-3 py-2'>
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

// Drag handle that lets the user resize the editor's nav sidebar by dragging
// its right edge. The 1px-wide visual line sits inside a 6px-wide hit area so
// the cursor catches the resize even when the user clicks slightly off — IDE
// muscle memory for this kind of handle. While dragging we own the body
// cursor and disable text selection so the column-resize cursor sticks even
// when the pointer slides over child elements.
function NavSidebarResizeHandle({
  width,
  onChange,
}: {
  width: number;
  onChange: (next: number) => void;
}) {
  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.button !== 0) return;
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = width;
      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);
      const prevBodyCursor = document.body.style.cursor;
      const prevBodySelect = document.body.style.userSelect;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMove = (e: PointerEvent) => {
        onChange(startWidth + (e.clientX - startX));
      };
      const onUp = (e: PointerEvent) => {
        target.releasePointerCapture(e.pointerId);
        target.removeEventListener("pointermove", onMove);
        target.removeEventListener("pointerup", onUp);
        target.removeEventListener("pointercancel", onUp);
        document.body.style.cursor = prevBodyCursor;
        document.body.style.userSelect = prevBodySelect;
      };
      target.addEventListener("pointermove", onMove);
      target.addEventListener("pointerup", onUp);
      target.addEventListener("pointercancel", onUp);
    },
    [width, onChange],
  );

  return (
    <div
      role='separator'
      aria-orientation='vertical'
      aria-valuenow={width}
      aria-valuemin={EDITOR_NAV_MIN}
      aria-valuemax={EDITOR_NAV_MAX}
      onPointerDown={onPointerDown}
      // Hit zone: 24px wide, asymmetric — 9px left of the aside's right edge,
      // 15px right of it. The aside has a 1px right border so absolute
      // `right` is offset 1px from the visible edge; the -16px nets to
      // +15px past the visible edge.
      className='group absolute inset-y-0 right-[-16px] z-20 w-6 cursor-col-resize'>
      <div className='absolute left-[9px] top-1/2 h-[120px] w-[4px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-transparent transition-colors group-hover:bg-foreground/30 group-active:bg-foreground/60' />
    </div>
  );
}

export function RepoBrowser() {
  const params = useParams();
  const navigate = useNavigate();
  const settings = useGitSettings();

  const branchParam = (params.branch as string | undefined) ?? null;
  const splatPath = (params["*"] as string | undefined) ?? "";
  const selectedPath = splatPath || null;

  const [allPaths, setAllPaths] = useState<string[]>([]);
  const [treeLoading, setTreeLoading] = useState(true);
  const [treeError, setTreeError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);

  const [files, setFiles] = useState<Record<string, FileEntry>>({});
  const fetchedPathsRef = useRef<Set<string>>(new Set());
  const [fileLoading, setFileLoading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [mode, setMode] = useState<ViewMode>("visual");
  const [settingsOpen, setSettingsOpen] = useState<OpenNavSettings | null>(null);
  const [configurationsOpen, setConfigurationsOpen] = useState(false);
  const [deletions, setDeletions] = useState<Set<string>>(new Set());
  const [navSidebarWidth, setNavSidebarWidth] = useEditorNavWidth();

  const currentBranch = branchParam;
  const [branches, setBranches] = useState<string[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [creatingPr, setCreatingPr] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const active = settings.status === "ready" ? settings.settings : null;

  const scopeKey = useMemo(() => {
    if (!active || !currentBranch) return null;
    return makeDraftScopeKey({
      installationId: active.installationId,
      owner: active.owner,
      repo: active.repo,
      branch: currentBranch,
    });
  }, [active, currentBranch]);

  // Reset in-memory file state when the scope changes, then hydrate any
  // unsaved drafts from localStorage so a refresh (or branch switch and
  // switch back) doesn't drop the in-progress change set. Persistence is
  // mirrored from the `files` watcher below.
  const lastScopeRef = useRef<string | null>(null);
  useEffect(() => {
    if (!scopeKey) return;
    if (lastScopeRef.current === scopeKey) return;

    const isFirstScope = lastScopeRef.current === null;
    lastScopeRef.current = scopeKey;

    if (!isFirstScope) {
      fetchedPathsRef.current = new Set();
      setSaveMessage(null);
    }

    const stored = loadDrafts(scopeKey);
    setFiles(stored.files);
    setDeletions(new Set(stored.deletions));
  }, [scopeKey]);

  // Mirror dirty entries and pending deletions to localStorage so a refresh
  // restores them. The first run after a scope change is skipped because
  // `files`/`deletions` still hold the previous scope's data when this
  // effect fires — we'd otherwise write stale entries into the new scope's
  // key. The hydration setFiles above triggers a second run with fresh
  // data, which persists correctly.
  const lastPersistedScopeRef = useRef<string | null>(null);
  useEffect(() => {
    if (!scopeKey) return;
    if (lastPersistedScopeRef.current !== scopeKey) {
      lastPersistedScopeRef.current = scopeKey;
      return;
    }
    const dirty: Record<string, FileEntry> = {};
    for (const [path, entry] of Object.entries(files)) {
      if (entry.original !== entry.draft) dirty[path] = entry;
    }
    saveDrafts(scopeKey, { files: dirty, deletions: Array.from(deletions) });
  }, [files, deletions, scopeKey]);

  // One-shot redirect tracker per branch, so editor → sidebar nav doesn't
  // re-trigger after the user explicitly navigates back to the no-path URL.
  const autoRedirectedRef = useRef<string | null>(null);

  const handleSelectPath = useCallback(
    (path: string) => {
      if (!currentBranch) return;
      // Close any open settings panel — choosing a page is a fresh context.
      setSettingsOpen(null);
      setConfigurationsOpen(false);
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
  const isCurrentDirty = currentEntry ? currentEntry.original !== currentEntry.draft : false;

  const matchesActive = !!active;

  const docsConfigState = useDocsConfig({
    installationId: active?.installationId ?? null,
    owner: active?.owner ?? null,
    repo: active?.repo ?? null,
    ref: currentBranch,
  });
  const themeConfigState = useThemeConfig({
    installationId: active?.installationId ?? null,
    owner: active?.owner ?? null,
    repo: active?.repo ?? null,
    ref: currentBranch,
  });

  const mdxPaths = useMemo(
    () => allPaths.filter((p) => p.endsWith(".mdx") || p.endsWith(".md")),
    [allPaths],
  );
  const frontmatterCacheState = useFrontmatterCache({
    installationId: active?.installationId ?? null,
    owner: active?.owner ?? null,
    repo: active?.repo ?? null,
    ref: currentBranch,
    paths: mdxPaths,
    knownFiles: files,
  });

  // Snippet files referenced from page MDX via Mintlify-style imports:
  //   `import Disclaimer from "/snippets/disclaimer.mdx"; <Disclaimer />`
  // Bases are tried in order — `content/snippets/` is the Nebula CLI
  // convention; `snippets/` is the Mintlify-shaped convention some
  // pre-migration tenants still use. Pre-fetch the snippet directory at
  // branch-load time so the editor's snippet NodeView can resolve
  // synchronously the moment a page mounts.
  const snippetsBases = useMemo(() => {
    const subdir = (active?.docsSubdirectory ?? "").replace(/\/+$/, "");
    const prefix = subdir ? `${subdir}/` : "";
    return [`${prefix}content/snippets`, `${prefix}snippets`];
  }, [active?.docsSubdirectory]);
  const docsSubdir = active?.docsSubdirectory ?? "";

  const loadedFilePaths = useMemo(() => new Set(Object.keys(files)), [files]);

  // The repo's full path set, used by `buildPageEntryResolver` to translate
  // a docs.json page entry like `"index"` into the actual MDX path. The
  // resolver prefers `<docsSubdirectory>/content/<page>.mdx` (CLI shape)
  // and falls back to `<docsSubdirectory>/<page>.mdx` (root shape) — the
  // same two-candidate pattern the snippet resolver uses. Threaded into
  // NavTree, the settings panel, and `findEntry`/`deleteEntry` so every
  // path comparison happens in the resolved-path namespace.
  const repoPathSet = useMemo(() => new Set(allPaths), [allPaths]);
  const resolveCtx = useMemo<ResolveContext>(
    () => ({ repoPaths: repoPathSet, docsSubdirectory: docsSubdir }),
    [repoPathSet, docsSubdir],
  );
  const resolvePagePath = useMemo(
    () => buildPageEntryResolver(repoPathSet, docsSubdir),
    [repoPathSet, docsSubdir],
  );

  const handleSnippetLoad = useCallback((path: string, entry: SnippetCacheEntry) => {
    setFiles((prev) => (prev[path] ? prev : { ...prev, [path]: entry }));
    // Mark prefetched snippets as fetched so opening one directly in the
    // file tree skips the duplicate Octokit round-trip.
    fetchedPathsRef.current.add(path);
  }, []);

  useSnippetPrefetch({
    installationId: active?.installationId ?? null,
    owner: active?.owner ?? null,
    repo: active?.repo ?? null,
    ref: currentBranch,
    allPaths,
    snippetsBases,
    loadedPaths: loadedFilePaths,
    onLoad: handleSnippetLoad,
  });

  const resolveSnippetContent = useMemo(
    () => buildSnippetResolver(files, snippetsBases, docsSubdir),
    [files, snippetsBases, docsSubdir],
  );

  const resolveSnippetRepoPath = useMemo(
    () => buildRepoPathResolver(files, snippetsBases, docsSubdir),
    [files, snippetsBases, docsSubdir],
  );

  const snippetCatalog = useSnippetCatalog(files, snippetsBases, docsSubdir);

  // Live in-memory docs config — derived from `files['docs.json'].draft` once
  // the user has touched any setting; otherwise from the initial fetch via
  // `useDocsConfig`. This single derivation keeps revert behaviour consistent
  // with every other dirty file.
  const liveDocsConfig = useMemo<DocsConfig | null>(() => {
    const entry = files["docs.json"];
    if (entry?.draft) {
      try {
        return JSON.parse(entry.draft) as DocsConfig;
      } catch {
        // Fall through to the loaded copy.
      }
    }
    return docsConfigState.config;
  }, [files, docsConfigState.config]);

  // MDX files on disk but not referenced anywhere in docs.json. Snippets are
  // intentionally never in the nav, so they don't count. Surfaced under the
  // curated nav tree as "Orphaned pages" so drafts and unwired files don't
  // disappear when docs.json is the source of truth for the sidebar. Drag a
  // row from this section onto any nav row to wire it in.
  const orphanedPagePaths = useMemo<string[]>(() => {
    if (!liveDocsConfig) return [];
    const referenced = new Set<string>();
    for (const entry of referencedPages(liveDocsConfig)) {
      const path = resolvePagePath(entry);
      if (path) referenced.add(path);
    }
    return allPaths
      .filter((p) => isMdxFile(p))
      .filter((p) => !p.includes("/snippets/"))
      .filter((p) => !REPO_METADATA_AT_ROOT.test(p))
      .filter((p) => !referenced.has(p))
      .sort();
  }, [liveDocsConfig, resolvePagePath, allPaths]);

  // Stable ids for every draggable row, in document order. Nav rows use the
  // same settings-key the row already mints (`tab:`, `group:`, `page:`),
  // orphans use `orphan:<path>`. SortableContext needs the full list, but
  // collapsed-but-not-rendered descendants are harmless — they have no DOM
  // node so collision detection skips them naturally.
  const navDragIds = useMemo<string[]>(() => {
    const ids: string[] = [];
    if (liveDocsConfig) {
      const tabs = liveDocsConfig.navigation?.tabs ?? [];
      const visit = (entry: PageEntry, keyPath: string): void => {
        if (typeof entry === "object" && entry !== null && "group" in entry) {
          const g = entry as Group;
          ids.push(`group:${keyPath}`);
          (g.pages ?? []).forEach((child, i) => visit(child as PageEntry, `${keyPath}/p${i}`));
        } else {
          const fp = resolvePagePath(entry);
          ids.push(`page:${fp ?? keyPath}`);
        }
      };
      tabs.forEach((tab, ti) => {
        ids.push(`tab:${tab.tab}`);
        const base = `tab${ti}`;
        (tab.pages ?? []).forEach((entry, i) => visit(entry, `${base}/d${i}`));
        (tab.groups ?? []).forEach((g, gi) => {
          const groupPath = `${base}/${gi}/${g.group}`;
          ids.push(`group:${groupPath}`);
          (g.pages ?? []).forEach((child, i) => visit(child, `${groupPath}/p${i}`));
        });
      });
    }
    for (const path of orphanedPagePaths) ids.push(`${ORPHAN_ID_PREFIX}${path}`);
    return ids;
  }, [liveDocsConfig, resolvePagePath, orphanedPagePaths]);

  // Drag-and-drop state. `hover` drives the drop-line indicator on whichever
  // row is currently the over target — overId + side. `dragOverlay` carries
  // a snapshot of the row being dragged so DragOverlay can render a ghost
  // preview that follows the cursor; without it the user only sees the
  // source row dim in place, which reads as "nothing's happening." Both
  // cleared on drop / cancel.
  const [hover, setHover] = useState<HoverState>({ overId: null, side: null });
  const [dragOverlay, setDragOverlay] = useState<{ id: string; label: string } | null>(null);
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  // Custom collision detection: prefer pointer-within (cursor literally
  // inside a row) for stable detection on container rows that don't shift
  // during the drag. Falls back to rectIntersection when the pointer is
  // between rows so the drag indicator never blanks out as the user moves
  // through gaps.
  const collisionDetection = useCallback((args: Parameters<typeof pointerWithin>[0]) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return rectIntersection(args);
  }, []);

  const handleDragStart = useCallback((e: DragStartEvent) => {
    setHover({ overId: null, side: null });
    const id = e.active?.id;
    if (typeof id !== "string") return;
    const ref = document.querySelector(`[data-dnd-id="${CSS.escape(id)}"]`);
    if (!(ref instanceof HTMLElement)) return;
    // Capture only the row's label text — the DragOverlay below renders a
    // compact Mintlify-style cursor pill rather than a full-width snapshot
    // of the source row. The whole-row preview was visually heavy and made
    // the drop target awkward to see.
    const labelEl = ref.querySelector("span.truncate, span");
    const label = labelEl?.textContent?.trim() || "";
    setDragOverlay({ id, label });
  }, []);

  const handleDragOver = useCallback((e: DragOverEvent) => {
    const overId = e.over?.id;
    const activeId = e.active?.id;
    if (!overId || typeof overId !== "string") {
      setHover({ overId: null, side: null });
      return;
    }
    const activeStr = typeof activeId === "string" ? activeId : "";
    const activeIsTab = activeStr.startsWith("tab:");
    const activeIsGroup = activeStr.startsWith("group:");
    const overIsTab = overId.startsWith("tab:");
    const overIsGroup = overId.startsWith("group:");
    if (overId.startsWith(ORPHAN_ID_PREFIX)) {
      // Orphan rows aren't drop targets.
      setHover({ overId: null, side: null });
      return;
    }
    const overRect = e.over?.rect;
    if (!overRect) return;
    const activeRect = e.active?.rect.current.translated;
    const pointerY = activeRect ? activeRect.top + activeRect.height / 2 : 0;

    // Container targets (tab, group): always 'into' for cross-kind drops,
    // 'above'/'below' only for same-kind reorder. The earlier three-zone
    // hit-test inside the container row turned out to be too jumpy — the
    // dragged page's centerline crosses the 25%/75% boundaries with even
    // tiny cursor moves, so the indicator flickered between 'into',
    // 'above', and 'below' as the user tried to release. Pages dropped on
    // a tab/group only ever mean "nest inside"; for above/below position
    // control the user can drop on a sibling page that's already at the
    // target position.
    if (overIsTab || overIsGroup) {
      if (overIsTab && activeIsTab) {
        const midY = overRect.top + overRect.height / 2;
        setHover({ overId, side: pointerY < midY ? "above" : "below" });
        return;
      }
      if (overIsGroup && activeIsGroup) {
        const midY = overRect.top + overRect.height / 2;
        setHover({ overId, side: pointerY < midY ? "above" : "below" });
        return;
      }
      const sourceIsPage = !activeIsTab && !activeIsGroup;
      if (sourceIsPage || (activeIsGroup && overIsTab)) {
        setHover({ overId, side: "into" });
        return;
      }
      // Other cross-kind combos (tab over group/page, etc.) — disallow.
      setHover({ overId: null, side: null });
      return;
    }
    // Page targets (leaf rows): same-kind reorder only.
    if (activeIsTab !== overIsTab) {
      setHover({ overId: null, side: null });
      return;
    }
    const midY = overRect.top + overRect.height / 2;
    const side: DropSide = pointerY < midY ? "above" : "below";
    setHover({ overId, side });
  }, []);

  const handleConfigChange = useCallback(
    (updater: (config: DocsConfig) => DocsConfig) => {
      setFiles((prev) => {
        const current = prev["docs.json"];
        const baseConfig = current?.draft
          ? (JSON.parse(current.draft) as DocsConfig)
          : docsConfigState.config;
        if (!baseConfig) return prev;
        const nextConfig = updater(baseConfig);
        const nextDraft = `${JSON.stringify(nextConfig, null, 2)}\n`;
        if (current && current.draft === nextDraft) return prev;
        if (!current) {
          const original = `${JSON.stringify(docsConfigState.config ?? baseConfig, null, 2)}\n`;
          return {
            ...prev,
            "docs.json": {
              original,
              draft: nextDraft,
              sha: "",
              revertNonce: 0,
            },
          };
        }
        return {
          ...prev,
          "docs.json": { ...current, draft: nextDraft },
        };
      });
    },
    [docsConfigState.config],
  );

  const handleDragEnd = useCallback(
    (e: DragEndEvent) => {
      const { active, over } = e;
      const activeId = String(active.id);
      const overId = over ? String(over.id) : null;
      const side = hover.side;
      setHover({ overId: null, side: null });
      setDragOverlay(null);

      if (!overId || !liveDocsConfig) return;
      if (overId === activeId) return;
      if (overId.startsWith(ORPHAN_ID_PREFIX)) return;

      // Tab-to-tab reorder. Source and target are both `tab:<name>`. We
      // resolve both to indices, compute the insert index from `side`,
      // and call `reorderTabs`. Cross-kind drops (tab over non-tab, etc.)
      // are blocked above by handleDragOver; double-check here so a stale
      // hover state can't slip through.
      if (activeId.startsWith("tab:") && overId.startsWith("tab:")) {
        const sourceResolved = findEntry(liveDocsConfig, activeId, resolveCtx);
        const targetResolved = findEntry(liveDocsConfig, overId, resolveCtx);
        if (
          !sourceResolved ||
          !targetResolved ||
          sourceResolved.kind !== "tab" ||
          targetResolved.kind !== "tab"
        )
          return;
        const fromIndex = sourceResolved.tabIndex;
        const insertIndex =
          side === "below" ? targetResolved.tabIndex + 1 : targetResolved.tabIndex;
        handleConfigChange((config) => reorderTabs(config, fromIndex, insertIndex));
        return;
      }
      // Tab as source is only valid for tab-to-tab reorder (handled above).
      // Any other tab-source path falls through here and exits.
      if (activeId.startsWith("tab:")) return;

      const targetResolved = findEntry(liveDocsConfig, overId, resolveCtx);
      if (!targetResolved) return;

      // 'into' drops: nest the source as a child of the target container.
      // For a tab target → append to `tab.pages` (or `tab.groups` if the
      //   source is itself a group).
      // For a group target → append to that group's own `pages` array.
      let dest: DocsInsertAddress;
      if (side === "into") {
        if (targetResolved.kind === "tab") {
          if (activeId.startsWith("group:")) {
            dest = {
              kind: "tab-groups",
              tabIndex: targetResolved.tabIndex,
              index: targetResolved.tab.groups?.length ?? 0,
            };
          } else {
            dest = {
              kind: "tab-pages",
              tabIndex: targetResolved.tabIndex,
              index: targetResolved.tab.pages?.length ?? 0,
            };
          }
        } else if (targetResolved.kind === "group") {
          dest = {
            kind: "group-pages",
            tabIndex: targetResolved.tabIndex,
            groupPath: targetResolved.groupPath,
            index: targetResolved.group.pages?.length ?? 0,
          };
        } else {
          return;
        }
      } else {
        const baseAddr = addressOfEntry(targetResolved);
        if (!baseAddr) return;
        dest = {
          ...baseAddr,
          index: side === "below" ? baseAddr.index + 1 : baseAddr.index,
        };
      }

      handleConfigChange((config) => {
        if (activeId.startsWith(ORPHAN_ID_PREFIX)) {
          // Source is an orphan: build a string PageEntry from its path and
          // insert at the destination. tab-groups can't host pages, so route
          // page-shaped sources to the corresponding tab-pages array.
          const path = activeId.slice(ORPHAN_ID_PREFIX.length);
          const slug = filePathToPageSlug(path, docsSubdir);
          if (!slug) return config;
          const insertDest: DocsInsertAddress =
            dest.kind === "tab-groups"
              ? { kind: "tab-pages", tabIndex: dest.tabIndex, index: dest.index }
              : dest;
          return insertEntryAt(config, insertDest, slug);
        }
        return moveEntryToAddress(config, activeId, dest, resolveCtx);
      });
    },
    [hover.side, liveDocsConfig, resolveCtx, handleConfigChange, docsSubdir],
  );

  const liveThemeConfig = useMemo<ThemeConfig | null>(() => {
    const entry = files["theme.json"];
    if (entry?.draft) {
      try {
        return JSON.parse(entry.draft) as ThemeConfig;
      } catch {
        // Fall through to the fetched copy.
      }
    }
    return themeConfigState.config;
  }, [files, themeConfigState.config]);

  // Mirror the tenant's resolved theme onto `.mdx-prose` so the editor
  // preview renders with the same accent colors a published page would.
  // Resolution mirrors `composeTokensCss` on the CLI:
  //
  //   getThemeById(theme.json.extends ?? 'mcoe-default')   ← base
  //     ⊕ theme.json.tokens                                ← overrides
  //
  // Scoped to mdx-prose (NOT the document root) so editor chrome —
  // sidebar, dialogs, source toggle — keeps Nebula's own `--brand`.
  // Inside mdx-prose, `--primary` is rebound to the tenant's brand,
  // which the Hero CTAs and other primary-driven components pick up
  // via the normal cascade.
  useEffect(() => {
    const baseId = liveThemeConfig?.extends ?? "mcoe-default";
    const base = getThemeById(baseId);
    const overrideTokens = liveThemeConfig?.tokens ?? {};
    const tokenAt = (key: keyof typeof base): string | null => {
      const o = overrideTokens[key];
      if (typeof o === "string" && o.length > 0) return o;
      const b = base[key];
      return typeof b === "string" && b.length > 0 ? b : null;
    };
    const brand = tokenAt("brandPrimary");
    const brandLight = tokenAt("brandPrimaryLight");
    const brandDark = tokenAt("brandPrimaryDark");
    if (!brand && !brandLight && !brandDark) return;
    const decls: string[] = [];
    // The platform's `--primary` resolves through `--brand`; the CLI's
    // resolves through `--mcoe-brand-primary`. Set every link in either
    // chain so this preview override is consumer-agnostic.
    if (brand) {
      decls.push(`--mcoe-brand-primary: ${brand};`);
      decls.push(`--brand: ${brand};`);
      decls.push(`--brand-text: ${brand};`);
      decls.push(`--primary: ${brand};`);
      // The platform's `:where(.mdx-prose) a { color: var(--brand-text) }`
      // rule wins specificity over Tailwind's `text-primary-foreground`,
      // so without an explicit foreground override the button text would
      // pick up Nebula's `--brand-text` despite our `--primary` swap.
      // White is a deliberate fallback that pairs with any saturated
      // brand bg — the CLI uses the equivalent (`--mcoe-bg-primary`) for
      // primary CTA text. Tenants with a light brand should override via
      // a custom theme.json key once we expose one.
      decls.push("--primary-foreground: #fff;");
    }
    if (brandLight) {
      decls.push(`--mcoe-brand-primary-light: ${brandLight};`);
      decls.push(`--brand-soft: ${brandLight};`);
    }
    if (brandDark) {
      decls.push(`--mcoe-brand-primary-dark: ${brandDark};`);
      decls.push(`--brand-hover: ${brandDark};`);
    }
    const styleEl = document.createElement("style");
    styleEl.dataset.nebulaTenantPreview = "";
    styleEl.textContent = `.mdx-prose { ${decls.join(" ")} }`;
    document.head.appendChild(styleEl);
    return () => {
      styleEl.remove();
    };
  }, [liveThemeConfig]);

  const handleThemeChange = useCallback(
    (updater: (config: ThemeConfig) => ThemeConfig) => {
      setFiles((prev) => {
        const current = prev["theme.json"];
        const baseConfig = current?.draft
          ? (JSON.parse(current.draft) as ThemeConfig)
          : (themeConfigState.config ?? { tokens: {} });
        const nextConfig = updater(baseConfig);
        const nextDraft = `${JSON.stringify(nextConfig, null, 2)}\n`;
        if (current && current.draft === nextDraft) return prev;
        if (!current) {
          const original = `${JSON.stringify(themeConfigState.config ?? baseConfig, null, 2)}\n`;
          return {
            ...prev,
            "theme.json": {
              original,
              draft: nextDraft,
              sha: "",
              revertNonce: 0,
            },
          };
        }
        return {
          ...prev,
          "theme.json": { ...current, draft: nextDraft },
        };
      });
    },
    [themeConfigState.config],
  );

  const handleFrontmatterChange = useCallback(
    (filePath: string, patch: Record<string, unknown>) => {
      setFiles((prev) => {
        const entry = prev[filePath];
        if (!entry) return prev;
        const nextDraft = applyFrontmatterPatch(entry.draft, patch);
        if (nextDraft === entry.draft) return prev;
        return { ...prev, [filePath]: { ...entry, draft: nextDraft } };
      });
    },
    [],
  );

  const handleDeleteOpenEntry = useCallback(() => {
    if (!settingsOpen || !liveDocsConfig) return;
    const resolved = findEntry(liveDocsConfig, settingsOpen.key, resolveCtx);
    if (!resolved) {
      setSettingsOpen(null);
      return;
    }
    handleConfigChange((cfg) => deleteEntry(cfg, settingsOpen.key, resolveCtx));
    if (resolved.kind === "page") {
      setDeletions((prev) => {
        const next = new Set(prev);
        next.add(resolved.filePath);
        return next;
      });
    }
    setSettingsOpen(null);
  }, [settingsOpen, liveDocsConfig, handleConfigChange, resolveCtx]);

  const handleAddEntry = useCallback(
    (parentKey: string, kind: AddEntryKind, value: string) => {
      if (!liveDocsConfig) return;
      const isTabParent = parentKey.startsWith("tab:");
      const append = (cfg: DocsConfig, entry: string | Group) =>
        isTabParent ? appendToTab(cfg, parentKey, entry) : appendToGroup(cfg, parentKey, entry);

      if (kind === "group") {
        const newGroup: Group = { group: value, pages: [] };
        handleConfigChange((cfg) => append(cfg, newGroup));
        return;
      }
      // kind === 'page' — append to docs.json AND seed a draft MDX file so the
      // next commit creates the file. The page navigates immediately when the
      // user clicks the new tree entry; the seeded body shows up in the editor.
      // Run the slug through the same resolver NavTree uses so the seeded
      // path matches what nav clicks will navigate to (CLI-shape repos seed
      // under `content/`; root-shape repos seed at the docs root).
      //
      // Auto-prefix with the parent tab's slug (Mintlify-editor parity). When
      // the user types `intro` inside Tab "Developers", we commit
      // `developers/intro` so the file lands at `content/developers/intro.mdx`
      // instead of root. The user can opt out by typing a slug that already
      // starts with the tab prefix or by typing an absolute-shaped slug
      // beginning with their own prefix (we only prepend when the slug doesn't
      // already start with `<tab-slug>/` and isn't equal to `<tab-slug>`).
      const rawSlug = value.replace(/\.mdx?$/i, "");
      const parentResolved = findEntry(liveDocsConfig, parentKey, resolveCtx);
      const parentTabIndex =
        parentResolved && "tabIndex" in parentResolved ? parentResolved.tabIndex : -1;
      const parentTabName =
        parentTabIndex >= 0 ? liveDocsConfig.navigation?.tabs?.[parentTabIndex]?.tab : undefined;
      const tabSlug = parentTabName ? slugifyTabName(parentTabName) : "";
      const slug =
        tabSlug && rawSlug !== tabSlug && !rawSlug.startsWith(`${tabSlug}/`)
          ? `${tabSlug}/${rawSlug}`
          : rawSlug;
      const filePath = resolvePagePath(slug) ?? `${slug}.mdx`;
      handleConfigChange((cfg) => append(cfg, slug));
      const title =
        slug
          .split("/")
          .pop()
          ?.replace(/[-_]+/g, " ")
          .replace(/^./, (c) => c.toUpperCase()) ?? slug;
      const initial = `---\ntitle: ${JSON.stringify(title)}\n---\n\n# ${title}\n`;
      setFiles((prev) =>
        prev[filePath]
          ? prev
          : {
              ...prev,
              [filePath]: {
                original: "",
                draft: initial,
                sha: "",
                revertNonce: 0,
              },
            },
      );
      // Mark as fetched so the file-load effect skips the Octokit GET — the
      // file doesn't exist on GitHub yet (only after Publish creates it). The
      // seeded draft is the source of truth until then.
      fetchedPathsRef.current.add(filePath);
    },
    [liveDocsConfig, handleConfigChange, resolvePagePath, resolveCtx],
  );

  const handleAddTab = useCallback(
    (name: string) => {
      if (!liveDocsConfig) return;
      const newTab: Tab = { tab: name };
      handleConfigChange((cfg) => appendTab(cfg, newTab));
    },
    [liveDocsConfig, handleConfigChange],
  );

  const handleAddAnchor = useCallback(
    (name: string) => {
      if (!liveDocsConfig) return;
      handleConfigChange((cfg) => appendAnchor(cfg, { anchor: name }));
    },
    [liveDocsConfig, handleConfigChange],
  );

  const handleAddDropdown = useCallback(
    (name: string) => {
      if (!liveDocsConfig) return;
      handleConfigChange((cfg) => appendDropdown(cfg, { dropdown: name }));
    },
    [liveDocsConfig, handleConfigChange],
  );

  const currentPageDraft = useMemo(() => {
    if (!settingsOpen || settingsOpen.kind !== "page") return null;
    const filePath = settingsOpen.key.replace(/^page:/, "");
    const entry = files[filePath];
    if (!entry) return null;
    return { path: filePath, content: entry.draft };
  }, [settingsOpen, files]);

  // Land on the first reachable page when the editor opens with no path.
  // Walks docs.json's nav (tabs → groups → pages, depth-first, skipping
  // hidden/external) and picks the first entry whose resolved file is
  // actually in the repo — the entry-path resolver returns a best-guess
  // path when it can't find a real candidate, so without this gate we'd
  // happily redirect to a 404. Fires once per branch.
  useEffect(() => {
    if (!currentBranch) return;
    if (selectedPath) return;
    if (autoRedirectedRef.current === currentBranch) return;
    if (treeLoading || allPaths.length === 0) return;
    if (docsConfigState.loading) return;
    if (!liveDocsConfig) return;
    let filePath: string | null = null;
    const entry = firstReachablePage(liveDocsConfig, (e) => {
      const candidate = resolvePagePath(e);
      if (!candidate) return false;
      if (!repoPathSet.has(candidate)) return false;
      filePath = candidate;
      return true;
    });
    if (!entry || !filePath) return;
    autoRedirectedRef.current = currentBranch;
    navigate(`/editor/${currentBranch}/~/${filePath}`, { replace: true });
  }, [
    currentBranch,
    selectedPath,
    treeLoading,
    allPaths.length,
    docsConfigState.loading,
    liveDocsConfig,
    repoPathSet,
    resolvePagePath,
    navigate,
  ]);

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
        setTreeError(err instanceof Error ? err.message : "Failed to load tree.");
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
    fetchFileContent(active.installationId, active.owner, active.repo, selectedPath, currentBranch)
      .then(({ content, sha }) => {
        if (cancelled) return;
        const normalized = isMdxFile(selectedPath) ? normalizeMdx(content) : content;
        setFiles((prev) => {
          // Preserve a hydrated draft if one is already in memory (from
          // localStorage restore). The fresh GitHub content becomes the new
          // `original` baseline so the dirty diff is computed against latest
          // upstream, not the snapshot from when the draft was made.
          const existing = prev[selectedPath];
          const hadDraft = existing && existing.draft !== existing.original;
          return {
            ...prev,
            [selectedPath]: {
              original: normalized,
              draft: hadDraft ? existing.draft : normalized,
              sha,
              revertNonce: existing?.revertNonce ?? 0,
            },
          };
        });
      })
      .catch((err) => {
        if (cancelled) return;
        fetchedPathsRef.current.delete(selectedPath);
        setFileError(err instanceof Error ? err.message : "Failed to load file.");
      })
      .finally(() => {
        if (!cancelled) setFileLoading(false);
      });
    return () => {
      cancelled = true;
      // Drop the in-flight marker on cleanup. Otherwise React StrictMode's
      // dev-only double-mount cancels the first fetch and bails the second
      // because `fetchedPathsRef.has(...)` is already true → `setFiles` never
      // runs and the file panel renders blank on initial deep-link loads.
      fetchedPathsRef.current.delete(selectedPath);
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

  const handleCreateBranch = async (name: string, base: string, bringChanges: boolean) => {
    if (!active) return;
    await createBranch(active.installationId, active.owner, active.repo, base, name);
    setBranches((prev) => (prev.includes(name) ? prev : [...prev, name].sort()));
    if (bringChanges) {
      // Dirty file drafts ride along — they're in our `files` map and will
      // commit to the new branch when navigation lands there.
    }
    navigateToBranch(name, true);
  };

  const deletionList = useMemo(() => Array.from(deletions), [deletions]);

  const handleSave = async (): Promise<boolean> => {
    if (!active || !currentBranch) return false;
    if (dirtyPaths.length === 0 && deletionList.length === 0) return false;
    setSaving(true);
    setSaveMessage(null);
    try {
      const changes: FileChange[] = [];
      for (const path of dirtyPaths) {
        const entry = files[path];
        if (entry) changes.push({ path, content: entry.draft });
      }
      for (const path of deletionList) {
        changes.push({ path, delete: true });
      }
      if (changes.length === 0) return false;
      const message =
        dirtyPaths.length + deletionList.length === 1
          ? deletionList.length === 1
            ? `Delete ${deletionList[0]}`
            : `Update ${dirtyPaths[0]}`
          : `Update ${dirtyPaths.length} file${dirtyPaths.length === 1 ? "" : "s"}` +
            (deletionList.length > 0 ? `, delete ${deletionList.length}` : "");
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
          if ("content" in change) {
            const entry = next[change.path];
            if (entry) next[change.path] = { ...entry, original: change.content };
          } else {
            // After successful deletion, drop the entry so the file map matches reality.
            delete next[change.path];
          }
        }
        return next;
      });
      setDeletions(new Set());
      const onDefault = currentBranch === active.defaultBranch;
      const count = changes.length;
      const fileLabel = `${count} change${count === 1 ? "" : "s"}`;
      // Toast for ephemeral feedback. The PublishMenu also closes its
      // popover on a successful save (see its onSave handler).
      if (onDefault) {
        toast.success("Published", {
          description: `Merged ${fileLabel} into ${currentBranch}.`,
        });
      } else {
        toast.success("Saved", {
          description: `Committed ${fileLabel} to ${currentBranch}.`,
        });
      }
      setSaveMessage(`Saved ${fileLabel} to ${currentBranch}.`);
      return true;
    } catch (err) {
      const detail = err instanceof Error ? err.message : "Save failed.";
      toast.error("Save failed", { description: detail });
      setSaveMessage(`Save failed: ${detail}`);
      return false;
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
      const detail = err instanceof Error ? err.message : "Failed to create PR.";
      setSaveMessage(`PR failed: ${detail}`);
      throw err instanceof Error ? err : new Error(detail);
    } finally {
      setCreatingPr(false);
    }
  };

  const publishChanges = useMemo<PublishChange[]>(
    () => [
      ...dirtyPaths.map((path) => ({ path, status: "modified" as const })),
      ...deletionList.map((path) => ({ path, status: "deleted" as const })),
    ],
    [dirtyPaths, deletionList],
  );

  const headerSlot = useMemo(() => {
    const showModeToggle = !configurationsOpen && selectedPath && isMdxFile(selectedPath);
    return (
      <>
        {showModeToggle ? (
          <div className='flex shrink-0 items-center gap-0.5 rounded-md border bg-background p-0.5'>
            <ModeButton
              active={mode === "visual"}
              onClick={() => setMode("visual")}
              icon={<Eye className='size-3.5' />}
              label='Visual'
            />
            <ModeButton
              active={mode === "source"}
              onClick={() => setMode("source")}
              icon={<Code2 className='size-3.5' />}
              label='Source'
            />
          </div>
        ) : null}
        {active && currentBranch ? (
          <BranchPicker
            currentBranch={currentBranch}
            defaultBranch={active.defaultBranch}
            branches={branches}
            loading={branchesLoading}
            hasDirty={dirtyPaths.length > 0}
            onSwitch={handleSwitchBranch}
            onCreate={handleCreateBranch}
          />
        ) : null}
        <div className='flex flex-1 items-center min-w-0 text-xs font-mono text-muted-foreground'>
          {configurationsOpen ? (
            <span className='truncate font-sans text-sm font-semibold not-italic text-foreground'>
              Configurations
            </span>
          ) : selectedPath ? (
            <span className='truncate'>
              {selectedPath}
              {isCurrentDirty ? (
                <span className='ml-2 text-amber-500' aria-label='unsaved'>
                  ●
                </span>
              ) : null}
            </span>
          ) : null}
        </div>
        {active && currentBranch && currentBranch !== active.defaultBranch ? (
          <PreviewButton
            repoFullName={`${active.owner}/${active.repo}`}
            branch={currentBranch}
          />
        ) : null}
        {active && currentBranch ? (
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
        ) : null}
      </>
    );
    // handleSave / handleCreatePr / handleSwitchBranch / handleCreateBranch
    // close over current state but are re-derived each render; including them
    // as deps would re-run the memo on every keystroke. The deps below cover
    // the actual inputs those handlers read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedPath,
    mode,
    isCurrentDirty,
    active,
    currentBranch,
    branches,
    branchesLoading,
    dirtyPaths.length,
    publishChanges,
    saving,
    creatingPr,
    saveMessage,
    configurationsOpen,
  ]);
  useHeaderSlot(headerSlot);

  // Empty leading placeholder so AppShell shifts the main slot right by w-72.
  // The repo sidebar (`-mt-12`) extends up to fill this column visually.
  const headerLeading = useMemo(() => <span aria-hidden='true' />, []);
  useHeaderLeading(headerLeading);

  const subdir = active?.docsSubdirectory ?? "";

  const filesTree = useMemo(() => buildTree(allPaths, subdir), [allPaths, subdir]);
  const navigationTree = useMemo(() => {
    const docs = allPaths.filter((p) => p.endsWith(".mdx") || p.endsWith(".md"));
    return buildTree(docs, subdir);
  }, [allPaths, subdir]);

  const filesCount = useMemo(() => countFiles(filesTree), [filesTree]);
  const navCount = useMemo(() => countFiles(navigationTree), [navigationTree]);

  if (settings.status === "loading") {
    return (
      <div className='-m-8 flex h-[calc(100vh-1rem)] items-center justify-center'>
        <PageLoader size={120} ringStyle='crisp' label='Loading workspace...' />
      </div>
    );
  }

  if (settings.status === "missing" || !active) {
    return <Navigate to='/settings/git' replace />;
  }

  return (
    <div className='-m-8 flex h-[calc(100vh-3rem)] min-h-0'>
      <aside
        style={{ width: navSidebarWidth }}
        className='relative -mt-12 flex h-screen shrink-0 flex-col overflow-hidden border-r border-border/20 bg-muted/30'>
        {active.docsSubdirectory ? (
          <div className='border-b border-border/40 px-4 py-2 text-xs text-muted-foreground'>
            <code>{active.docsSubdirectory}</code>
          </div>
        ) : null}

        <Tabs defaultValue='navigation' className='flex flex-1 flex-col overflow-hidden gap-0'>
          <TabsList className='grid w-full shrink-0 grid-cols-2 rounded-none border-b bg-transparent p-0 group-data-[orientation=horizontal]/tabs:h-12'>
            <TabsTrigger
              value='navigation'
              className='relative h-[calc(100%-1px)] gap-1.5 rounded-none border-0 px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none after:absolute group-data-[orientation=horizontal]/tabs:after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:bg-foreground after:opacity-0 data-[state=active]:after:opacity-100'>
              <Map className='size-4' />
              Navigation
            </TabsTrigger>
            <TabsTrigger
              value='files'
              className='relative h-[calc(100%-1px)] gap-1.5 rounded-none border-0 px-4 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none after:absolute group-data-[orientation=horizontal]/tabs:after:bottom-[-1px] after:left-0 after:right-0 after:h-0.5 after:bg-foreground after:opacity-0 data-[state=active]:after:opacity-100'>
              <Files className='size-4' />
              Files
            </TabsTrigger>
          </TabsList>
          <TabsContent value='navigation' className='flex-1 overflow-y-auto'>
            {docsConfigState.loading ? (
              <NavTreeSkeleton />
            ) : docsConfigState.error ? (
              <p className='px-3 py-2 text-sm text-destructive'>{docsConfigState.error}</p>
            ) : liveDocsConfig ? (
              <DndContext
                sensors={dndSensors}
                collisionDetection={collisionDetection}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragEnd={handleDragEnd}
                onDragCancel={() => {
                  setHover({ overId: null, side: null });
                  setDragOverlay(null);
                }}>
                <SortableContext items={navDragIds} strategy={verticalListSortingStrategy}>
                  <HoverProvider hover={hover}>
                    <NavTree
                      config={liveDocsConfig}
                      selectedPath={selectedPath}
                      onSelectPath={handleSelectPath}
                      settingsOpenKey={settingsOpen?.key ?? null}
                      onOpenSettings={setSettingsOpen}
                      onAddEntry={handleAddEntry}
                      onAddTab={handleAddTab}
                      onAddAnchor={handleAddAnchor}
                      onAddDropdown={handleAddDropdown}
                      repoPaths={repoPathSet}
                      docsSubdirectory={docsSubdir}
                      frontmatterCache={frontmatterCacheState.cache}
                      frontmatterLoaded={frontmatterCacheState.loaded}
                    />
                    <OrphanedPages
                      paths={orphanedPagePaths}
                      selectedPath={selectedPath}
                      onSelectPath={handleSelectPath}
                      docsSubdirectory={docsSubdir}
                    />
                  </HoverProvider>
                </SortableContext>
                <DragOverlay dropAnimation={null}>
                  {dragOverlay ? (
                    /* Compact cursor pill — dark surface + label + a faint
                       border. Mintlify-style: small enough to feel like an
                       indicator attached to the cursor, not a full row
                       being dragged around. Sized to content, max-width
                       caps long labels so the pill doesn't sprawl. */
                    <div className='pointer-events-none inline-flex max-w-[14rem] items-center gap-1.5 rounded-md border border-border/60 bg-popover px-2 py-1 text-xs font-medium text-foreground shadow-lg'>
                      <span className='truncate'>{dragOverlay.label}</span>
                    </div>
                  ) : null}
                </DragOverlay>
              </DndContext>
            ) : (
              <FileTreePanel
                tree={navigationTree}
                loading={treeLoading}
                error={treeError}
                emptyMessage={`No docs.json found${subdir ? ` in ${subdir}` : ""}.`}
                selectedPath={selectedPath}
                onSelect={handleSelectPath}
                hideExtensions
              />
            )}
          </TabsContent>
          <TabsContent value='files' className='flex-1 overflow-y-auto'>
            <FileTreePanel
              tree={filesTree}
              loading={treeLoading}
              error={treeError}
              emptyMessage={`No files found${subdir ? ` in ${subdir}` : ""}.`}
              selectedPath={selectedPath}
              onSelect={handleSelectPath}
            />
          </TabsContent>
        </Tabs>

        <div className='border-t border-border/40 px-4 py-2 text-xs text-muted-foreground'>
          {navCount} doc{navCount === 1 ? "" : "s"} · {filesCount} file
          {filesCount === 1 ? "" : "s"}
          {truncated ? " · tree truncated" : ""}
        </div>
        <button
          type='button'
          onClick={() => {
            setSettingsOpen(null);
            setConfigurationsOpen((open) => !open);
          }}
          aria-pressed={configurationsOpen}
          className={cn(
            "flex h-11 shrink-0 cursor-pointer items-center gap-2 border-t border-border/40 px-4 text-sm font-semibold transition-colors",
            configurationsOpen
              ? "bg-accent text-brand-text"
              : "text-foreground/80 hover:bg-accent/60 hover:text-foreground",
          )}>
          <Settings className='size-4' />
          Configurations
        </button>
        <NavSidebarResizeHandle width={navSidebarWidth} onChange={setNavSidebarWidth} />
      </aside>
      {settingsOpen ? (
        <NavSettingsPanel
          settings={settingsOpen}
          onClose={() => setSettingsOpen(null)}
          config={liveDocsConfig}
          onConfigChange={handleConfigChange}
          pageDraft={currentPageDraft}
          onFrontmatterChange={handleFrontmatterChange}
          onDelete={handleDeleteOpenEntry}
          resolveCtx={resolveCtx}
        />
      ) : null}
      <main className='flex flex-1 flex-col overflow-hidden bg-background'>
        {configurationsOpen ? (
          <ConfigurationsPanel
            config={liveDocsConfig}
            onConfigChange={handleConfigChange}
            themeConfig={liveThemeConfig}
            onThemeChange={handleThemeChange}
          />
        ) : (
          <SnippetResolverProvider
            resolveContent={resolveSnippetContent}
            resolveRepoPath={resolveSnippetRepoPath}
            catalog={snippetCatalog}>
            <FileViewer
              path={selectedPath}
              content={currentEntry?.draft ?? null}
              revertNonce={currentEntry?.revertNonce ?? 0}
              loading={fileLoading}
              error={fileError}
              mode={mode}
              onContentChange={handleContentChange}
            />
          </SnippetResolverProvider>
        )}
      </main>
    </div>
  );
}

function countFiles(nodes: TreeNode[]): number {
  let n = 0;
  for (const node of nodes) {
    if (node.type === "file") n++;
    else if (node.children) n += countFiles(node.children);
  }
  return n;
}
