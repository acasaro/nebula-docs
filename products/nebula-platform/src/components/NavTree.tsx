import { useMemo, useState, type MouseEvent as ReactMouseEvent, type ReactNode } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FilePlus,
  FolderPlus,
  FileSearch,
  Folder,
  Plus,
  Settings,
} from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { Icon } from '@nebula-docs/components';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  defaultPageTitle,
  iconNameOf,
  isGroup,
  isPageObject,
  pageEntryToFilePath,
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

export type AddEntryKind = 'page' | 'group' | 'existing';

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
  /** Add a page / group / existing-file entry to the named group. */
  onAddEntry?: (parentKey: NavSettingsKey, kind: AddEntryKind, value: string) => void;
  /** All file paths in the repo — used by the "add existing file" flow. */
  repoPaths?: string[];
  /** Per-page frontmatter values keyed by file path. NavTree uses
   *  `sidebarTitle`, `icon`, `tag`, `hidden` from each entry as overrides
   *  on top of the docs.json defaults. */
  frontmatterCache?: Record<string, Record<string, unknown> | null>;
  /** Set of paths the cache has finished fetching (regardless of parse
   *  success). Used to gate skeleton loaders. */
  frontmatterLoaded?: ReadonlySet<string>;
}

// Pixel widths used to compute the cascading text-indent. The pattern:
//   group_text_x = row_indent + chevron + gap + icon + gap
//   tab_text_x   = row_indent + icon + gap        (tabs don't have chevrons)
// Children's row_indent = parent's text_x so pages align under their parent's title.
const ROOT_PL = 8;
const CHEVRON = 14;
const ICON = 14;
const GAP = 4;
const TAB_TEXT_OFFSET = ICON + GAP;             // icon + gap
const GROUP_TEXT_OFFSET = CHEVRON + GAP + ICON + GAP;

export function NavTree({
  config,
  selectedPath,
  onSelectPath,
  settingsOpenKey,
  onOpenSettings,
  onAddEntry,
  repoPaths,
  frontmatterCache,
  frontmatterLoaded,
}: NavTreeProps) {
  const tabs = (config.navigation?.tabs ?? []).filter((t) => !t.hidden);

  return (
    <div className="flex flex-col gap-1 py-2 pr-2">
      <div className="flex items-center justify-between pl-2 pr-1 pt-1 pb-1 text-xs text-muted-foreground/70">
        <span>Navigation</span>
        <button
          type="button"
          aria-label="Add to navigation"
          className="flex size-5 items-center justify-center rounded text-muted-foreground/70 transition-colors hover:bg-accent hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
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
            repoPaths={repoPaths}
            frontmatterCache={frontmatterCache}
            frontmatterLoaded={frontmatterLoaded}
          />
        ))}
      </div>
    </div>
  );
}

interface SectionCommon {
  selectedPath: string | null;
  onSelectPath: (path: string) => void;
  settingsOpenKey: NavSettingsKey | null;
  onOpenSettings: (next: OpenNavSettings | null) => void;
  onAddEntry?: (parentKey: NavSettingsKey, kind: AddEntryKind, value: string) => void;
  repoPaths?: string[];
  frontmatterCache?: Record<string, Record<string, unknown> | null>;
  frontmatterLoaded?: ReadonlySet<string>;
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
  repoPaths,
  frontmatterCache,
  frontmatterLoaded,
}: {
  tab: Tab;
  tabIndex: number;
  indent: number;
} & SectionCommon) {
  const groups = (tab.groups ?? []).filter((g) => !g.hidden);
  const hasIcon = !!iconNameOf(tab.icon);
  const tabTextX = indent + (hasIcon ? TAB_TEXT_OFFSET : 0);
  const settingsKey: NavSettingsKey = `tab:${tab.tab}`;
  const settingsOpen = settingsOpenKey === settingsKey;
  const groupKeyBase = `tab${tabIndex}`;
  return (
    <div className="flex flex-col gap-0.5">
      <Row
        paddingLeft={indent}
        settingsOpen={settingsOpen}
        showActions
        actions={
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
        }
      >
        {hasIcon ? <NavIcon icon={tab.icon} fallback={null} /> : null}
        <Title>{tab.tab}</Title>
      </Row>
      <div className="flex flex-col gap-0.5">
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
            repoPaths={repoPaths}
            frontmatterCache={frontmatterCache}
            frontmatterLoaded={frontmatterLoaded}
          />
        ))}
      </div>
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
  repoPaths,
  frontmatterCache,
  frontmatterLoaded,
}: {
  group: Group;
  indent: number;
  keyPath: string;
} & SectionCommon) {
  const [expanded, setExpanded] = useState(group.expanded ?? true);
  const pages = group.pages ?? [];
  const childIndent = indent + GROUP_TEXT_OFFSET;
  const settingsKey: NavSettingsKey = `group:${keyPath}`;
  const settingsOpen = settingsOpenKey === settingsKey;
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
              parentKey={settingsKey}
              onAddEntry={onAddEntry}
              repoPaths={repoPaths}
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
              repoPaths={repoPaths}
              frontmatterCache={frontmatterCache}
              frontmatterLoaded={frontmatterLoaded}
            />
          ))}
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
  repoPaths,
  frontmatterCache,
  frontmatterLoaded,
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
        repoPaths={repoPaths}
        frontmatterCache={frontmatterCache}
        frontmatterLoaded={frontmatterLoaded}
      />
    );
  }
  const filePath = pageEntryToFilePath(entry);
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
  fallback?: 'folder' | null;
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

function ActionButton({
  ariaLabel,
  onClick,
  children,
}: {
  ariaLabel: string;
  onClick: (e: ReactMouseEvent) => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      className="flex size-5 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}

function pageKey(entry: PageEntry, i: number): string {
  if (typeof entry === 'string') return entry;
  if (isGroup(entry)) return `group:${entry.group}:${i}`;
  return `page:${entry.page ?? entry.slug ?? i}`;
}

interface AddEntryButtonProps {
  parentLabel: string;
  parentKey: NavSettingsKey;
  onAddEntry?: (parentKey: NavSettingsKey, kind: AddEntryKind, value: string) => void;
  repoPaths?: string[];
}

function AddEntryButton({
  parentLabel,
  parentKey,
  onAddEntry,
  repoPaths,
}: AddEntryButtonProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [dialogKind, setDialogKind] = useState<AddEntryKind | null>(null);
  const [textValue, setTextValue] = useState('');
  const [pickedFile, setPickedFile] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  const closeAll = () => {
    setPopoverOpen(false);
    setDialogKind(null);
    setTextValue('');
    setPickedFile(null);
    setFilter('');
  };

  const handlePick = (kind: AddEntryKind) => {
    setPopoverOpen(false);
    setDialogKind(kind);
  };

  const submit = () => {
    if (!onAddEntry || !dialogKind) return;
    if (dialogKind === 'existing') {
      if (!pickedFile) return;
      const slug = pickedFile.replace(/\.mdx?$/i, '');
      onAddEntry(parentKey, 'existing', slug);
    } else {
      const value = textValue.trim();
      if (!value) return;
      onAddEntry(parentKey, dialogKind, value);
    }
    closeAll();
  };

  const mdxPaths = useMemo(
    () => (repoPaths ?? []).filter((p) => /\.mdx?$/i.test(p)),
    [repoPaths],
  );
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return q
      ? mdxPaths.filter((p) => p.toLowerCase().includes(q))
      : mdxPaths.slice(0, 100);
  }, [mdxPaths, filter]);

  return (
    <>
      <Popover.Root open={popoverOpen} onOpenChange={setPopoverOpen}>
        <Popover.Trigger asChild>
          <ActionButton
            ariaLabel={`Add to ${parentLabel}`}
            onClick={(e) => {
              e.stopPropagation();
              setPopoverOpen(true);
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
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
              onClick={() => handlePick('existing')}
            >
              <FileSearch className="size-3.5" />
              Add existing file
            </button>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>

      <Dialog open={!!dialogKind} onOpenChange={(open) => !open && closeAll()}>
        <DialogContent
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <DialogHeader>
            <DialogTitle>
              {dialogKind === 'page'
                ? `Add a page to ${parentLabel}`
                : dialogKind === 'group'
                  ? `Add a group inside ${parentLabel}`
                  : `Add an existing file to ${parentLabel}`}
            </DialogTitle>
            <DialogDescription>
              {dialogKind === 'page'
                ? 'Enter a slug — a new MDX file will be created on the next commit.'
                : dialogKind === 'group'
                  ? 'Enter the group title — pages can be moved into it later.'
                  : 'Pick an MDX file already in the repo.'}
            </DialogDescription>
          </DialogHeader>
          {dialogKind === 'existing' ? (
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Filter…"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                autoFocus
              />
              <div className="max-h-64 overflow-y-auto rounded border border-border/40">
                {filtered.length === 0 ? (
                  <p className="px-3 py-4 text-sm text-muted-foreground">
                    No matching files.
                  </p>
                ) : (
                  filtered.map((path) => (
                    <button
                      key={path}
                      type="button"
                      onClick={() => setPickedFile(path)}
                      className={cn(
                        'flex w-full items-center px-3 py-1.5 text-left text-sm hover:bg-accent',
                        pickedFile === path && 'bg-accent text-accent-foreground',
                      )}
                    >
                      {path}
                    </button>
                  ))
                )}
              </div>
            </div>
          ) : (
            <Input
              placeholder={
                dialogKind === 'page' ? 'getting-started' : 'Group title'
              }
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  submit();
                }
              }}
            />
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeAll}>
              Cancel
            </Button>
            <Button
              onClick={submit}
              disabled={
                dialogKind === 'existing'
                  ? !pickedFile
                  : !textValue.trim()
              }
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
