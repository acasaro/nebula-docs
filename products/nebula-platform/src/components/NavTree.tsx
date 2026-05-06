import {
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from 'react';
import {
  ChevronDown,
  ChevronRight,
  ChevronsDownUp,
  FilePlus,
  FolderPlus,
  Folder,
  LayoutPanelTop,
  Plus,
  Settings,
} from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { Icon } from '@nebula-docs/components';
import { cn } from '@/lib/utils';
import {
  buildPageEntryResolver,
  defaultPageTitle,
  iconNameOf,
  isGroup,
  isPageObject,
  type DocsConfig,
  type Group,
  type IconValue,
  type PageEntry,
  type Tab,
} from '@/lib/docsConfig';

/**
 * Identifier for the row whose settings panel is currently open. The format
 * is `<kind>:<key>` so the same string can disambiguate between a tab, a
 * group, and a page that happen to share a label.
 *   - "tab:Documentation"
 *   - "group:tab0/0/Create content"
 *   - "page:documentation/overview.mdx"
 */
export type NavSettingsKey = string;

export type NavSettingsKind = 'tab' | 'group' | 'page';

export type AddEntryKind = 'page' | 'group';

export interface OpenNavSettings {
  key: NavSettingsKey;
  kind: NavSettingsKind;
  title: string;
}

interface NavTreeProps {
  config: DocsConfig;
  selectedPath: string | null;
  onSelectPath: (path: string) => void;
  /** Identifier of the row whose settings panel is open, or `null`. */
  settingsOpenKey: NavSettingsKey | null;
  /** Called with the row that was clicked, or `null` to close. Pass an open
   * descriptor (kind + title + key) so the parent can render the right panel
   * without re-walking the tree. */
  onOpenSettings: (next: OpenNavSettings | null) => void;
  /** Append a page or group entry under a named group. */
  onAddEntry?: (parentKey: NavSettingsKey, kind: AddEntryKind, value: string) => void;
  /** Append a top-level tab to `navigation.tabs`. */
  onAddTab?: (name: string) => void;
  /** All file paths in the repo — used to resolve docs.json page entries to
   *  actual MDX paths via `buildPageEntryResolver`. */
  repoPaths?: ReadonlySet<string>;
  /** Subdirectory of the repo where the docs live. Empty string for the
   *  common case where docs.json is at the repo root. */
  docsSubdirectory?: string;
  /** Per-page frontmatter values keyed by file path. NavTree uses
   *  `sidebarTitle`, `icon`, `tag`, `hidden` from each entry as overrides
   *  on top of the docs.json defaults. */
  frontmatterCache?: Record<string, Record<string, unknown> | null>;
  /** Set of paths the cache has finished fetching (regardless of parse
   *  success). Used to gate skeleton loaders. */
  frontmatterLoaded?: ReadonlySet<string>;
}

/** Bumped by the Collapse-all header button. Each TabSection / GroupSection
 *  watches it and resets its local `expanded` to false on change. Kept as a
 *  number signal (not a boolean) so consecutive presses always re-collapse,
 *  even when something was re-expanded between presses. */
type CollapseSignal = number;

// Stable reference so the resolver memo doesn't churn when no repoPaths
// were passed in (early-render case).
const EMPTY_PATH_SET: ReadonlySet<string> = new Set<string>();

// Pixel widths used to compute the cascading text-indent. Tabs and groups
// share the same shape (chevron + icon + label) so children align under
// their parent's title at the same offset regardless of parent kind.
const ROOT_PL = 8;
const CHEVRON = 14;
const ICON = 14;
const GAP = 4;
const GROUP_TEXT_OFFSET = CHEVRON + GAP + ICON + GAP;

export function NavTree({
  config,
  selectedPath,
  onSelectPath,
  settingsOpenKey,
  onOpenSettings,
  onAddEntry,
  onAddTab,
  repoPaths,
  docsSubdirectory,
  frontmatterCache,
  frontmatterLoaded,
}: NavTreeProps) {
  const tabs = (config.navigation?.tabs ?? []).filter((t) => !t.hidden);
  const [addingTab, setAddingTab] = useState(false);
  const [collapseSignal, setCollapseSignal] = useState<CollapseSignal>(0);

  const resolveEntryPath = useMemo(
    () => buildPageEntryResolver(repoPaths ?? EMPTY_PATH_SET, docsSubdirectory ?? ''),
    [repoPaths, docsSubdirectory],
  );

  return (
    <div className="flex flex-col gap-1 py-2 pr-2">
      <div className="flex items-center justify-between pl-2 pr-1 pt-1 pb-1 text-xs text-muted-foreground/70">
        <span>Navigation</span>
        <div className="flex items-center gap-0.5">
          <CollapseAllButton onCollapseAll={() => setCollapseSignal((n) => n + 1)} />
          <NavigationAddButton onPickTab={() => setAddingTab(true)} />
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        {tabs.map((tab, i) => (
          <TabSection
            key={`${tab.tab}-${i}`}
            tab={tab}
            tabIndex={i}
            indent={ROOT_PL}
            selectedPath={selectedPath}
            onSelectPath={onSelectPath}
            settingsOpenKey={settingsOpenKey}
            onOpenSettings={onOpenSettings}
            onAddEntry={onAddEntry}
            resolveEntryPath={resolveEntryPath}
            frontmatterCache={frontmatterCache}
            frontmatterLoaded={frontmatterLoaded}
            collapseSignal={collapseSignal}
          />
        ))}
        {addingTab ? (
          <InlineAddRow
            kind="tab"
            indent={ROOT_PL}
            onCommit={(value) => {
              onAddTab?.(value);
              setAddingTab(false);
            }}
            onCancel={() => setAddingTab(false)}
          />
        ) : null}
      </div>
    </div>
  );
}

interface CollapseAllButtonProps {
  onCollapseAll: () => void;
}

/** Header button that collapses every Tab and Group section in one click.
 *  Sits next to the `+` so the muscle memory for "navigation toolbar"
 *  controls stays grouped. */
function CollapseAllButton({ onCollapseAll }: CollapseAllButtonProps) {
  return (
    <button
      type="button"
      aria-label="Collapse all navigation folders"
      title="Collapse all"
      onClick={(e) => {
        e.stopPropagation();
        onCollapseAll();
      }}
      className="flex size-5 items-center justify-center rounded text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
    >
      <ChevronsDownUp className="size-3.5" />
    </button>
  );
}

interface NavigationAddButtonProps {
  onPickTab: () => void;
}

/**
 * Top-level Navigation `+` — the only thing you can add at the root of
 * navigation is a tab, so the popover has a single item. Mirrors the
 * group-level `AddEntryButton` shape so the muscle memory transfers.
 */
function NavigationAddButton({ onPickTab }: NavigationAddButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="Add to navigation"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
          className="flex size-5 items-center justify-center rounded text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={4}
          align="end"
          className={cn(
            'z-50 min-w-[160px] rounded-md border bg-popover p-1 shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-2 pb-1 pt-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground/70">
            Add
          </div>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => {
              setOpen(false);
              onPickTab();
            }}
          >
            <LayoutPanelTop className="size-3.5" />
            Tab
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

interface SectionCommon {
  selectedPath: string | null;
  onSelectPath: (path: string) => void;
  settingsOpenKey: NavSettingsKey | null;
  onOpenSettings: (next: OpenNavSettings | null) => void;
  onAddEntry?: (parentKey: NavSettingsKey, kind: AddEntryKind, value: string) => void;
  /** Built once at the top of the tree from the repo path set + docs
   *  subdirectory, then threaded down so every page row gets the same
   *  resolution semantics (CLI `content/` shape preferred, legacy root
   *  shape as fallback). */
  resolveEntryPath: (entry: PageEntry) => string | null;
  frontmatterCache?: Record<string, Record<string, unknown> | null>;
  frontmatterLoaded?: ReadonlySet<string>;
  collapseSignal: CollapseSignal;
}

function TabSection({
  tab,
  tabIndex,
  indent,
  selectedPath,
  onSelectPath,
  settingsOpenKey,
  onOpenSettings,
  onAddEntry,
  resolveEntryPath,
  frontmatterCache,
  frontmatterLoaded,
  collapseSignal,
}: {
  tab: Tab;
  tabIndex: number;
  indent: number;
} & SectionCommon) {
  const groups = (tab.groups ?? []).filter((g) => !g.hidden);
  const directPages = tab.pages ?? [];
  // Tabs and groups share the same row shape (chevron + icon + label) so
  // children align under the tab title at the same offset they'd use under
  // a group title.
  const tabTextX = indent + GROUP_TEXT_OFFSET;
  const settingsKey: NavSettingsKey = `tab:${tab.tab}`;
  const settingsOpen = settingsOpenKey === settingsKey;
  const groupKeyBase = `tab${tabIndex}`;
  const [addingKind, setAddingKind] = useState<AddEntryKind | null>(null);
  const [expanded, setExpanded] = useState(true);

  // Collapse-all signal: setting expanded=false on every signal bump (skip
  // the initial mount so we don't fight the default-open state). The header
  // button increments the signal; we react.
  const lastSignalRef = useRef(collapseSignal);
  useEffect(() => {
    if (collapseSignal !== lastSignalRef.current) {
      lastSignalRef.current = collapseSignal;
      setExpanded(false);
      setAddingKind(null);
    }
  }, [collapseSignal]);

  const commitAdd = (value: string) => {
    if (!addingKind) return;
    onAddEntry?.(settingsKey, addingKind, value);
    setAddingKind(null);
  };

  const beginAdd = (kind: AddEntryKind) => {
    if (!expanded) setExpanded(true);
    setAddingKind(kind);
  };

  return (
    <div className="flex flex-col gap-0.5">
      <Row
        paddingLeft={indent}
        settingsOpen={settingsOpen}
        onClick={() => setExpanded((e) => !e)}
        showActions
        actions={
          <>
            <AddEntryButton
              parentLabel={tab.tab}
              onPick={beginAdd}
            />
            <SettingsToggle
              label={tab.tab}
              isOpen={settingsOpen}
              onToggle={() =>
                onOpenSettings(
                  settingsOpen
                    ? null
                    : { key: settingsKey, kind: 'tab', title: tab.tab },
                )
              }
            />
          </>
        }
      >
        <Chevron expanded={expanded} />
        <NavIcon icon={tab.icon} fallback="tab" />
        <Title>{tab.tab}</Title>
      </Row>
      {expanded ? (
        <div className="flex flex-col gap-0.5">
          {directPages.map((entry, i) => (
            <PageOrGroup
              key={pageKey(entry, i)}
              entry={entry}
              indent={tabTextX}
              keyPath={`${groupKeyBase}/d${i}`}
              selectedPath={selectedPath}
              onSelectPath={onSelectPath}
              settingsOpenKey={settingsOpenKey}
              onOpenSettings={onOpenSettings}
              onAddEntry={onAddEntry}
              resolveEntryPath={resolveEntryPath}
              frontmatterCache={frontmatterCache}
              frontmatterLoaded={frontmatterLoaded}
              collapseSignal={collapseSignal}
            />
          ))}
          {groups.map((group, i) => (
            <GroupSection
              key={`${group.group}-${i}`}
              group={group}
              indent={tabTextX}
              keyPath={`${groupKeyBase}/${i}/${group.group}`}
              selectedPath={selectedPath}
              onSelectPath={onSelectPath}
              settingsOpenKey={settingsOpenKey}
              onOpenSettings={onOpenSettings}
              onAddEntry={onAddEntry}
              resolveEntryPath={resolveEntryPath}
              frontmatterCache={frontmatterCache}
              frontmatterLoaded={frontmatterLoaded}
              collapseSignal={collapseSignal}
            />
          ))}
          {addingKind ? (
            <InlineAddRow
              kind={addingKind}
              indent={tabTextX}
              onCommit={commitAdd}
              onCancel={() => setAddingKind(null)}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function GroupSection({
  group,
  indent,
  keyPath,
  selectedPath,
  onSelectPath,
  settingsOpenKey,
  onOpenSettings,
  onAddEntry,
  resolveEntryPath,
  frontmatterCache,
  frontmatterLoaded,
  collapseSignal,
}: {
  group: Group;
  indent: number;
  keyPath: string;
} & SectionCommon) {
  const [expanded, setExpanded] = useState(group.expanded ?? true);
  const [addingKind, setAddingKind] = useState<AddEntryKind | null>(null);
  const pages = group.pages ?? [];
  const childIndent = indent + GROUP_TEXT_OFFSET;
  const settingsKey: NavSettingsKey = `group:${keyPath}`;
  const settingsOpen = settingsOpenKey === settingsKey;

  const lastSignalRef = useRef(collapseSignal);
  useEffect(() => {
    if (collapseSignal !== lastSignalRef.current) {
      lastSignalRef.current = collapseSignal;
      setExpanded(false);
      setAddingKind(null);
    }
  }, [collapseSignal]);

  const beginAdd = (kind: AddEntryKind) => {
    if (!expanded) setExpanded(true);
    setAddingKind(kind);
  };

  const commitAdd = (value: string) => {
    if (!addingKind) return;
    onAddEntry?.(settingsKey, addingKind, value);
    setAddingKind(null);
  };

  return (
    <div className="flex flex-col gap-0.5">
      <Row
        paddingLeft={indent}
        settingsOpen={settingsOpen}
        onClick={() => setExpanded((e) => !e)}
        showActions
        actions={
          <>
            <AddEntryButton
              parentLabel={group.group}
              onPick={beginAdd}
            />
            <SettingsToggle
              label={group.group}
              isOpen={settingsOpen}
              onToggle={() =>
                onOpenSettings(
                  settingsOpen
                    ? null
                    : { key: settingsKey, kind: 'group', title: group.group },
                )
              }
            />
          </>
        }
      >
        <Chevron expanded={expanded} />
        <NavIcon icon={group.icon} fallback="folder" />
        <Title>{group.group}</Title>
      </Row>
      {expanded ? (
        <div className="flex flex-col gap-0.5">
          {pages.map((entry, i) => (
            <PageOrGroup
              key={pageKey(entry, i)}
              entry={entry}
              indent={childIndent}
              keyPath={`${keyPath}/p${i}`}
              selectedPath={selectedPath}
              onSelectPath={onSelectPath}
              settingsOpenKey={settingsOpenKey}
              onOpenSettings={onOpenSettings}
              onAddEntry={onAddEntry}
              resolveEntryPath={resolveEntryPath}
              frontmatterCache={frontmatterCache}
              frontmatterLoaded={frontmatterLoaded}
              collapseSignal={collapseSignal}
            />
          ))}
          {addingKind ? (
            <InlineAddRow
              kind={addingKind}
              indent={childIndent}
              onCommit={commitAdd}
              onCancel={() => setAddingKind(null)}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function PageOrGroup({
  entry,
  indent,
  keyPath,
  selectedPath,
  onSelectPath,
  settingsOpenKey,
  onOpenSettings,
  onAddEntry,
  resolveEntryPath,
  frontmatterCache,
  frontmatterLoaded,
  collapseSignal,
}: {
  entry: PageEntry;
  indent: number;
  keyPath: string;
} & SectionCommon) {
  if (isGroup(entry)) {
    return (
      <GroupSection
        group={entry}
        indent={indent}
        keyPath={keyPath}
        selectedPath={selectedPath}
        onSelectPath={onSelectPath}
        settingsOpenKey={settingsOpenKey}
        onOpenSettings={onOpenSettings}
        onAddEntry={onAddEntry}
        resolveEntryPath={resolveEntryPath}
        frontmatterCache={frontmatterCache}
        frontmatterLoaded={frontmatterLoaded}
        collapseSignal={collapseSignal}
      />
    );
  }
  const filePath = resolveEntryPath(entry);
  const isSelected = filePath !== null && filePath === selectedPath;

  // Frontmatter is the source of truth per Mintlify; docs.json values are
  // legacy fallbacks. `hidden` removes the row entirely.
  const fm = filePath ? frontmatterCache?.[filePath] ?? null : null;
  if (fm && fm.hidden === true) return null;

  const fmSidebarTitle = typeof fm?.sidebarTitle === 'string' ? fm.sidebarTitle : null;
  const fmTitle = typeof fm?.title === 'string' ? fm.title : null;
  const fmIcon = typeof fm?.icon === 'string' ? fm.icon : null;

  const slugTitle =
    typeof entry === 'string'
      ? defaultPageTitle(entry)
      : entry.page
        ? defaultPageTitle(entry.page)
        : 'Untitled';
  const docsObjTitle = isPageObject(entry) ? entry.sidebarTitle : undefined;
  const title = fmSidebarTitle ?? fmTitle ?? docsObjTitle ?? slugTitle;

  const docsObjIcon = isPageObject(entry) ? entry.icon : undefined;
  const iconValue = fmIcon ?? docsObjIcon;
  const hasIcon = !!iconNameOf(iconValue);

  // Page settings keys prefer file path so settings persist across renders
  // even when the docs.json position shifts.
  const settingsKey: NavSettingsKey = `page:${filePath ?? keyPath}`;
  const settingsOpen = settingsOpenKey === settingsKey;

  return (
    <Row
      paddingLeft={indent}
      selected={isSelected}
      settingsOpen={settingsOpen}
      onClick={filePath ? () => onSelectPath(filePath) : undefined}
      showActions
      actions={
        <SettingsToggle
          label={title}
          isOpen={settingsOpen}
          onToggle={() =>
            onOpenSettings(
              settingsOpen
                ? null
                : { key: settingsKey, kind: 'page', title },
            )
          }
        />
      }
    >
      {hasIcon ? <NavIcon icon={iconValue} fallback={null} /> : null}
      <Title>{title}</Title>
    </Row>
  );
}

interface RowProps {
  paddingLeft: number;
  selected?: boolean;
  /** When true, this row's settings panel is open. Renders as a persistent
   * highlighted pill (same look as `selected`) so both pieces of state can
   * coexist (e.g. file open in editor vs. settings open on a different row). */
  settingsOpen?: boolean;
  onClick?: () => void;
  showActions?: boolean;
  actions?: ReactNode;
  children: ReactNode;
}

function Row({
  paddingLeft,
  selected,
  settingsOpen,
  onClick,
  showActions,
  actions,
  children,
}: RowProps) {
  const highlighted = selected || settingsOpen;
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'group/nav-row relative flex h-8 items-center justify-between rounded-xl pl-2 pr-1 text-sm font-semibold transition-colors select-none outline-none',
        onClick && 'cursor-pointer',
        highlighted
          ? 'bg-accent text-accent-foreground'
          : 'text-foreground/70 hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground',
      )}
      style={{ marginLeft: `${paddingLeft}px` }}
    >
      <div className="flex min-w-0 items-center gap-1">{children}</div>
      {showActions && actions ? (
        <div
          className={cn(
            'flex shrink-0 items-center gap-0.5 transition-opacity',
            // Only the settings-open state pins the actions visible (because
            // the gear has flipped to the chevron, signalling "panel open"
            // for this row). Selected rows still show actions only on hover.
            settingsOpen
              ? 'opacity-100'
              : 'opacity-0 group-hover/nav-row:opacity-100 focus-within:opacity-100',
          )}
        >
          {actions}
        </div>
      ) : null}
    </div>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <ChevronDown
      className={cn(
        'size-3.5 shrink-0 text-muted-foreground transition-transform',
        !expanded && '-rotate-90',
      )}
      aria-hidden="true"
    />
  );
}

function NavIcon({
  icon,
  fallback,
}: {
  icon: IconValue | undefined;
  fallback?: 'folder' | 'tab' | null;
}) {
  const name = iconNameOf(icon);
  if (name) {
    return (
      <Icon
        icon={name}
        iconLibrary="lucide"
        size={14}
        className="shrink-0 text-muted-foreground"
      />
    );
  }
  if (fallback === 'folder') {
    return <Folder className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />;
  }
  if (fallback === 'tab') {
    // Matches the icon used in the Navigation `+` popover so a new tab the
    // user creates inline shows the same shape they just clicked to make it.
    return <LayoutPanelTop className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />;
  }
  return null;
}

function Title({ children }: { children: ReactNode }) {
  return <span className="truncate">{children}</span>;
}

/** Gear ↔ chevron-right icon swap. Closed = gear (open settings); open =
 * chevron-right (settings panel is showing this row, click to close). */
function SettingsToggle({
  label,
  isOpen,
  onToggle,
}: {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <ActionButton
      ariaLabel={isOpen ? `Close settings for ${label}` : `Edit ${label}`}
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
    >
      {isOpen ? (
        <ChevronRight className="size-3.5" />
      ) : (
        <Settings className="size-3.5" />
      )}
    </ActionButton>
  );
}

type ActionButtonProps = {
  ariaLabel: string;
  onClick: (e: ReactMouseEvent) => void;
  children: ReactNode;
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'aria-label' | 'onClick' | 'children' | 'type' | 'className'>;

/**
 * Forwards refs and spreads extra props so it can be the child of
 * `<Popover.Trigger asChild>` — Radix attaches a ref + ARIA state via Slot,
 * and without forwarding the popover renders at (0, 0) (visibly offscreen
 * above the sidebar) because Radix can't measure the trigger's bounding
 * rect. Same applies to any other Radix `asChild` slot we route through.
 */
const ActionButton = forwardRef<HTMLButtonElement, ActionButtonProps>(
  function ActionButton({ ariaLabel, onClick, children, ...rest }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        aria-label={ariaLabel}
        onClick={onClick}
        className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        {...rest}
      >
        {children}
      </button>
    );
  },
);

function pageKey(entry: PageEntry, i: number): string {
  if (typeof entry === 'string') return entry;
  if (isGroup(entry)) return `group:${entry.group}:${i}`;
  return `page:${entry.page ?? entry.slug ?? i}`;
}

interface AddEntryButtonProps {
  parentLabel: string;
  onPick: (kind: AddEntryKind) => void;
}

function AddEntryButton({ parentLabel, onPick }: AddEntryButtonProps) {
  const [open, setOpen] = useState(false);

  const handlePick = (kind: AddEntryKind) => {
    setOpen(false);
    onPick(kind);
  };

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <ActionButton
          ariaLabel={`Add to ${parentLabel}`}
          onClick={(e) => {
            e.stopPropagation();
            setOpen(true);
          }}
        >
          <Plus className="size-3.5" />
        </ActionButton>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={4}
          align="end"
          className={cn(
            'z-50 min-w-[180px] rounded-md border bg-popover p-1 shadow-md',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => handlePick('page')}
          >
            <FilePlus className="size-3.5" />
            Add a page
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
            onClick={() => handlePick('group')}
          >
            <FolderPlus className="size-3.5" />
            Add a group
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

type InlineAddKind = AddEntryKind | 'tab';

interface InlineAddRowProps {
  kind: InlineAddKind;
  indent: number;
  onCommit: (value: string) => void;
  onCancel: () => void;
}

/**
 * Inline editable row used for naming a new page, sub-group, or tab. Commits
 * on Enter, cancels on Escape. Blurring with a non-empty value commits too —
 * matches the "click outside to save" feel of file-explorer rename UIs.
 */
function InlineAddRow({ kind, indent, onCommit, onCancel }: InlineAddRowProps) {
  const placeholder =
    kind === 'page'
      ? 'untitled-page'
      : kind === 'group'
        ? 'untitled-group'
        : 'untitled-tab';
  const [value, setValue] = useState(placeholder);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const committedRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const finish = (mode: 'commit' | 'cancel') => {
    if (committedRef.current) return;
    committedRef.current = true;
    const trimmed = value.trim();
    if (mode === 'commit' && trimmed) onCommit(trimmed);
    else onCancel();
  };

  const KindIcon =
    kind === 'page' ? FilePlus : kind === 'group' ? FolderPlus : LayoutPanelTop;

  return (
    <div
      className="group/nav-row relative flex h-8 items-center rounded-xl bg-accent/40 pl-2 pr-1 text-sm font-semibold"
      style={{ marginLeft: `${indent}px` }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex min-w-0 items-center gap-1">
        <KindIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              finish('commit');
            } else if (e.key === 'Escape') {
              e.preventDefault();
              finish('cancel');
            }
          }}
          onBlur={() => finish('commit')}
          spellCheck={false}
          className={cn(
            'min-w-0 flex-1 border-0 border-b border-primary bg-transparent px-0 py-0',
            'text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground',
          )}
        />
      </div>
    </div>
  );
}

