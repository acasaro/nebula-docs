import { Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { OpenNavSettings } from '@/components/NavTree';
import {
  GroupSettingsForm,
  type GroupConfigValues,
  type PagePickerOption,
  NavItemSettingsForm,
  type NavItemConfigValues,
  PageSettingsForm,
  type PageFrontmatterValues,
  TabSettingsForm,
  type TabConfigValues,
} from '@/components/nav-settings';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  docsIconToForm,
  formIconToDocs,
  type DocsIconValue,
  type IconValue as FormIconValue,
} from '@/components/IconField';
import {
  findEntry,
  type ResolveContext,
  type ResolvedEntry,
} from '@/lib/docsConfigOps';
import {
  splitFrontmatter,
} from '@/lib/frontmatter';
import type {
  Anchor,
  DocsConfig,
  Dropdown,
  Group,
  MenuItem,
  PageObject,
  Tab,
} from '@/lib/docsConfig';

const PANEL_TITLE: Record<OpenNavSettings['kind'], string> = {
  page: 'Page settings',
  group: 'Group settings',
  tab: 'Tab settings',
  anchor: 'Anchor settings',
  dropdown: 'Dropdown settings',
  'menu-item': 'Menu item settings',
};

interface NavSettingsPanelProps {
  settings: OpenNavSettings;
  onClose: () => void;
  config: DocsConfig | null;
  onConfigChange: (updater: (config: DocsConfig) => DocsConfig) => void;
  pageDraft: { path: string; content: string } | null;
  onFrontmatterChange: (
    filePath: string,
    patch: Record<string, unknown>,
  ) => void;
  onDelete: () => void;
  /** Repo path set + docs subdirectory used to translate docs.json page
   *  entries to their actual MDX paths. Required for `findEntry` to match
   *  page settings keys minted by NavTree. */
  resolveCtx: ResolveContext;
}

/**
 * Settings panel anchored to the right edge of the navigation column. It
 * resolves the current selection (`settings.key`) to a live entry inside
 * `config`, builds form values, and routes patches back through
 * `onConfigChange` / `onFrontmatterChange`.
 *
 * The trash button confirms before calling `onDelete` — for pages, the
 * caller is responsible for both removing the docs.json entry and queuing
 * the MDX file for deletion in the next commit.
 */
export function NavSettingsPanel({
  settings,
  onClose,
  config,
  onConfigChange,
  pageDraft,
  onFrontmatterChange,
  onDelete,
  resolveCtx,
}: NavSettingsPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const resolved = useMemo(
    () => (config ? findEntry(config, settings.key, resolveCtx) : null),
    [config, settings.key, resolveCtx],
  );

  return (
    <aside
      className="fixed inset-y-0 z-40 flex w-[550px] flex-col overflow-hidden border-r border-border/20 bg-background"
      style={{ left: 'calc(14rem + 18rem)' }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-muted/30"
      />
      <header className="relative z-10 flex h-12 shrink-0 items-center justify-between border-b border-border/20 px-4">
        <span className="text-sm font-semibold">
          {PANEL_TITLE[settings.kind]}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={`Delete ${settings.title}`}
            onClick={() => setConfirmDelete(true)}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Close settings"
            onClick={onClose}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      </header>
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4">
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          Editing
        </p>
        <p className="mb-6 mt-1 text-base font-semibold">{settings.title}</p>
        {resolved ? (
          <SettingsBody
            resolved={resolved}
            settingsKey={settings.key}
            onConfigChange={onConfigChange}
            pageDraft={pageDraft}
            onFrontmatterChange={onFrontmatterChange}
            resolveCtx={resolveCtx}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Could not resolve this entry in the current docs.json.
          </p>
        )}
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete {settings.title}?</DialogTitle>
            <DialogDescription>
              {settings.kind === 'page'
                ? 'The MDX file will be removed from the next commit, along with its docs.json entry.'
                : 'This entry will be removed from docs.json on the next commit.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmDelete(false);
                onDelete();
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}

function SettingsBody({
  resolved,
  settingsKey,
  onConfigChange,
  pageDraft,
  onFrontmatterChange,
  resolveCtx,
}: {
  resolved: ResolvedEntry;
  settingsKey: string;
  onConfigChange: (updater: (config: DocsConfig) => DocsConfig) => void;
  pageDraft: { path: string; content: string } | null;
  onFrontmatterChange: (
    filePath: string,
    patch: Record<string, unknown>,
  ) => void;
  resolveCtx: ResolveContext;
}) {
  if (resolved.kind === 'tab') {
    const tab = resolved.tab as Tab & Record<string, unknown>;
    const values: TabConfigValues = {
      title: tab.tab ?? '',
      icon: docsIconToForm(tab.icon),
      hidden: !!tab.hidden,
      href: (tab.href as string | undefined) ?? '',
      align: (tab.align as string | undefined) ?? 'start',
      directory: (tab.directory as string | undefined) ?? 'none',
    };
    const availablePages = collectTabPages(tab);
    const onChange = (patch: Partial<TabConfigValues>) => {
      onConfigChange((config) =>
        replaceResolvedEntry(
          config,
          settingsKey,
          (e) =>
            e.kind === 'tab' ? mergeTab(e.tab, patch) : (e as ResolvedEntry),
          resolveCtx,
        ),
      );
    };
    return (
      <TabSettingsForm
        values={values}
        onChange={onChange}
        availablePages={availablePages}
      />
    );
  }

  if (resolved.kind === 'group') {
    const group = resolved.group as Group & Record<string, unknown>;
    const values: GroupConfigValues = {
      title: group.group ?? '',
      icon: docsIconToForm(group.icon),
      hidden: !!group.hidden,
      tag: (group.tag as string | undefined) ?? '',
      expanded: group.expanded ?? true,
      openapi: (group.openapi as string | undefined) ?? '',
      asyncapi: (group.asyncapi as string | undefined) ?? '',
      root: (group.root as string | undefined) ?? '',
    };
    const availablePages = collectGroupPages(group);
    const onChange = (patch: Partial<GroupConfigValues>) => {
      onConfigChange((config) =>
        replaceResolvedEntry(
          config,
          settingsKey,
          (e) =>
            e.kind === 'group' ? mergeGroup(e.group, patch) : (e as ResolvedEntry),
          resolveCtx,
        ),
      );
    };
    return (
      <GroupSettingsForm
        values={values}
        onChange={onChange}
        availablePages={availablePages}
      />
    );
  }

  if (
    resolved.kind === 'anchor' ||
    resolved.kind === 'dropdown' ||
    resolved.kind === 'menu-item'
  ) {
    const kind = resolved.kind;
    let label = '';
    let icon: unknown;
    let hidden = false;
    let href = '';
    let description = '';
    let availablePages: PagePickerOption[] = [];
    if (kind === 'anchor') {
      const a = resolved.anchor as Anchor & Record<string, unknown>;
      label = a.anchor ?? '';
      icon = a.icon;
      hidden = !!a.hidden;
      href = (a.href as string | undefined) ?? '';
      availablePages = collectChildPages(a.pages, a.groups);
    } else if (kind === 'dropdown') {
      const d = resolved.dropdown as Dropdown & Record<string, unknown>;
      label = d.dropdown ?? '';
      icon = d.icon;
      hidden = !!d.hidden;
      href = (d.href as string | undefined) ?? '';
      availablePages = collectChildPages(d.pages, d.groups);
    } else {
      const m = resolved.item as MenuItem & Record<string, unknown>;
      label = m.item ?? '';
      icon = m.icon;
      hidden = !!m.hidden;
      href = (m.href as string | undefined) ?? '';
      description = (m.description as string | undefined) ?? '';
      availablePages = collectChildPages(m.pages, m.groups);
    }
    const values: NavItemConfigValues = {
      title: label,
      icon: docsIconToForm(icon as Parameters<typeof docsIconToForm>[0]),
      hidden,
      href,
      description,
    };
    const onChange = (patch: Partial<NavItemConfigValues>) => {
      onConfigChange((config) =>
        replaceResolvedEntry(
          config,
          settingsKey,
          (e) => mergeNavItem(e, patch),
          resolveCtx,
        ),
      );
    };
    return (
      <NavItemSettingsForm
        kind={kind}
        values={values}
        onChange={onChange}
        availablePages={availablePages}
      />
    );
  }

  // page — Mintlify model: every page setting lives in frontmatter; docs.json
  // only carries the slug. Legacy PageObject overrides in docs.json are
  // honoured as read-side fallbacks; edits always write through to the MDX
  // frontmatter so the next save migrates the value forward.
  const pageObj = resolved.pageObject;
  const stringEntry =
    !pageObj && typeof resolved.page === 'string' ? resolved.page : null;
  const slug = pageObj?.page ?? stringEntry ?? '';
  const fmParsed =
    pageDraft && pageDraft.path === resolved.filePath
      ? splitFrontmatter(pageDraft.content).frontmatter
      : null;
  const fm = fmParsed?.values ?? {};

  const values: PageFrontmatterValues = {
    title: stringValue(fm.title) ?? '',
    description:
      stringValue(fm.description) ?? pageObj?.description ?? '',
    sidebarTitle:
      stringValue(fm.sidebarTitle) ?? pageObj?.sidebarTitle ?? '',
    icon: docsIconToForm(
      stringValue(fm.icon) ?? (pageObj?.icon as DocsIconValue | undefined),
    ),
    tag: stringValue(fm.tag) ?? pageObj?.tag ?? '',
    hidden: boolValue(fm.hidden) ?? !!pageObj?.hidden,
    mode: stringValue(fm.mode) ?? pageObj?.mode ?? 'default',
    url: stringValue(fm.url) ?? pageObj?.externalUrl ?? '',
    keywords: arrayValue(fm.keywords) ?? pageObj?.keywords ?? [],
    ogImage: stringValue(fm.ogImage) ?? pageObj?.ogImage ?? '',
    backgroundColor: stringValue(fm.backgroundColor) ?? '',
    backgroundColorDark: stringValue(fm.backgroundColorDark) ?? '',
  };

  const onPatch = (patch: Partial<PageFrontmatterValues>) => {
    if (!pageDraft) return;
    const out: Record<string, unknown> = {};
    for (const [key, raw] of Object.entries(patch)) {
      if (key === 'icon') {
        const next = formIconToFrontmatterString(raw as PageFrontmatterValues['icon']);
        out.icon = next;
        continue;
      }
      out[key] = raw === '' ? null : raw;
    }
    onFrontmatterChange(pageDraft.path, out);
  };
  return <PageSettingsForm slug={slug} values={values} onChange={onPatch} />;
}

/**
 * Walk a tab's pages + groups to collect every reachable page slug, in nav
 * order. Used by `TabSettingsForm` to populate the href page-picker so the
 * tab's tree of pages is one click away — without forcing the user to type
 * the slug. External-URL pages are skipped (they're not navigable docs
 * pages within this tenant).
 */
function collectTabPages(tab: Tab): PagePickerOption[] {
  const out: PagePickerOption[] = [];
  const seen = new Set<string>();
  const push = (slug: string, label: string) => {
    if (seen.has(slug)) return;
    seen.add(slug);
    out.push({ slug, label });
  };
  const prettify = (slug: string): string => {
    const last = slug.split('/').pop() ?? slug;
    return last
      .replace(/[-_]+/g, ' ')
      .replace(/^(.)/, (c) => c.toUpperCase());
  };
  const walkEntry = (entry: unknown): void => {
    if (typeof entry === 'string') {
      push(entry, prettify(entry));
      return;
    }
    if (!entry || typeof entry !== 'object') return;
    const e = entry as Record<string, unknown>;
    if ('group' in e && Array.isArray(e.pages)) {
      for (const child of e.pages) walkEntry(child);
      return;
    }
    if (typeof e.externalUrl === 'string') return;
    const slug =
      typeof e.slug === 'string'
        ? e.slug
        : typeof e.page === 'string'
          ? e.page
          : null;
    if (!slug) return;
    const label =
      (typeof e.sidebarTitle === 'string' && e.sidebarTitle) || prettify(slug);
    push(slug, label);
  };
  for (const entry of tab.pages ?? []) walkEntry(entry);
  for (const group of tab.groups ?? []) {
    for (const entry of group.pages ?? []) walkEntry(entry);
  }
  return out;
}

/**
 * Walk a pages array + a groups array (the shape anchors/dropdowns/menu-items
 * carry) to collect every reachable page slug. Same logic as
 * `collectGroupPages` but factored to accept the raw arrays so callers don't
 * need a synthetic Group wrapper.
 */
function collectChildPages(
  pages: unknown[] | undefined,
  groups: unknown[] | undefined,
): PagePickerOption[] {
  const synthetic: Group = {
    group: '',
    pages: ([
      ...(pages ?? []),
      ...((groups as unknown as Group[]) ?? []),
    ] as unknown[]) as Group['pages'],
  };
  return collectGroupPages(synthetic);
}

/**
 * Walk a group's pages (recursing into nested groups) to collect every
 * reachable page slug, in nav order. Used by `GroupSettingsForm` to
 * populate the root page-picker.
 */
function collectGroupPages(group: Group): PagePickerOption[] {
  const out: PagePickerOption[] = [];
  const seen = new Set<string>();
  const push = (slug: string, label: string) => {
    if (seen.has(slug)) return;
    seen.add(slug);
    out.push({ slug, label });
  };
  const prettify = (slug: string): string => {
    const last = slug.split('/').pop() ?? slug;
    return last
      .replace(/[-_]+/g, ' ')
      .replace(/^(.)/, (c) => c.toUpperCase());
  };
  const walkEntry = (entry: unknown): void => {
    if (typeof entry === 'string') {
      push(entry, prettify(entry));
      return;
    }
    if (!entry || typeof entry !== 'object') return;
    const e = entry as Record<string, unknown>;
    if ('group' in e && Array.isArray(e.pages)) {
      for (const child of e.pages) walkEntry(child);
      return;
    }
    if (typeof e.externalUrl === 'string') return;
    const slug =
      typeof e.slug === 'string'
        ? e.slug
        : typeof e.page === 'string'
          ? e.page
          : null;
    if (!slug) return;
    const label =
      (typeof e.sidebarTitle === 'string' && e.sidebarTitle) || prettify(slug);
    push(slug, label);
  };
  for (const entry of group.pages ?? []) walkEntry(entry);
  return out;
}

function stringValue(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

function boolValue(v: unknown): boolean | null {
  return typeof v === 'boolean' ? v : null;
}

function numberOrEmpty(v: unknown): string {
  if (typeof v === 'number') return String(v);
  if (typeof v === 'string') return v;
  return '';
}

function arrayValue(v: unknown): string[] | null {
  return Array.isArray(v) ? v.map(String) : null;
}

function formIconToFrontmatterString(
  icon: PageFrontmatterValues['icon'],
): string | null {
  if (!icon || !icon.icon) return null;
  return icon.icon;
}

function mergeTab(tab: Tab, patch: Partial<TabConfigValues>): Tab {
  const next: Tab & Record<string, unknown> = { ...tab };
  if (patch.title !== undefined) next.tab = patch.title;
  if (patch.icon !== undefined) next.icon = formIconToDocs(patch.icon);
  if (patch.hidden !== undefined) next.hidden = patch.hidden || undefined;
  if (patch.href !== undefined)
    next.href = patch.href ? patch.href : undefined;
  if (patch.align !== undefined)
    next.align = patch.align && patch.align !== 'start' ? patch.align : undefined;
  if (patch.directory !== undefined)
    next.directory =
      patch.directory && patch.directory !== 'none' ? patch.directory : undefined;
  return next;
}

/**
 * Merge a NavItem patch back onto its underlying anchor/dropdown/menu-item.
 * Returns the replacement entry the resolver-level mutator should write.
 * Each kind has a different label key — `anchor.anchor` / `dropdown.dropdown`
 * / `menu-item.item` — but the rest of the field set is shared.
 */
function mergeNavItem(
  resolved: ResolvedEntry,
  patch: Partial<NavItemConfigValues>,
): unknown {
  if (resolved.kind === 'anchor') {
    const next: Anchor & Record<string, unknown> = { ...resolved.anchor };
    if (patch.title !== undefined) next.anchor = patch.title;
    if (patch.icon !== undefined) next.icon = formIconToDocs(patch.icon);
    if (patch.hidden !== undefined) next.hidden = patch.hidden || undefined;
    if (patch.href !== undefined) next.href = patch.href ? patch.href : undefined;
    return next;
  }
  if (resolved.kind === 'dropdown') {
    const next: Dropdown & Record<string, unknown> = { ...resolved.dropdown };
    if (patch.title !== undefined) next.dropdown = patch.title;
    if (patch.icon !== undefined) next.icon = formIconToDocs(patch.icon);
    if (patch.hidden !== undefined) next.hidden = patch.hidden || undefined;
    if (patch.href !== undefined) next.href = patch.href ? patch.href : undefined;
    return next;
  }
  if (resolved.kind === 'menu-item') {
    const next: MenuItem & Record<string, unknown> = { ...resolved.item };
    if (patch.title !== undefined) next.item = patch.title;
    if (patch.icon !== undefined) next.icon = formIconToDocs(patch.icon);
    if (patch.hidden !== undefined) next.hidden = patch.hidden || undefined;
    if (patch.href !== undefined) next.href = patch.href ? patch.href : undefined;
    if (patch.description !== undefined)
      next.description = patch.description ? patch.description : undefined;
    return next;
  }
  return resolved as unknown;
}

function mergeGroup(group: Group, patch: Partial<GroupConfigValues>): Group {
  const next: Group & Record<string, unknown> = { ...group };
  if (patch.title !== undefined) next.group = patch.title;
  if (patch.icon !== undefined) next.icon = formIconToDocs(patch.icon);
  if (patch.hidden !== undefined) next.hidden = patch.hidden || undefined;
  if (patch.tag !== undefined) next.tag = patch.tag.trim() || undefined;
  if (patch.expanded !== undefined) next.expanded = patch.expanded;
  if (patch.openapi !== undefined)
    next.openapi = patch.openapi ? patch.openapi : undefined;
  if (patch.asyncapi !== undefined)
    next.asyncapi = patch.asyncapi ? patch.asyncapi : undefined;
  if (patch.root !== undefined)
    next.root = patch.root ? patch.root : undefined;
  return next;
}


function replaceResolvedEntry(
  config: DocsConfig,
  key: string,
  replacer: (resolved: ResolvedEntry) => unknown,
  resolveCtx: ResolveContext,
): DocsConfig {
  const resolved = findEntry(config, key, resolveCtx);
  if (!resolved) return config;
  return mutateResolvedEntry(config, resolved, replacer(resolved));
}

function mutateResolvedEntry(
  config: DocsConfig,
  resolved: ResolvedEntry,
  replacement: unknown,
): DocsConfig {
  const next: DocsConfig = JSON.parse(JSON.stringify(config));
  const tabs = next.navigation?.tabs ?? [];
  if (!next.navigation) next.navigation = { tabs };

  if (resolved.kind === 'tab') {
    tabs[resolved.tabIndex] = replacement as Tab;
    return next;
  }

  if (resolved.kind === 'group') {
    const tab = tabs[resolved.tabIndex];
    if (!tab) return next;
    const groups = tab.groups ?? [];
    if (!tab.groups) tab.groups = groups;
    if (resolved.groupPath.length === 1) {
      groups[resolved.groupPath[0]!] = replacement as Group;
      return next;
    }
    let parent: Group | undefined = groups[resolved.groupPath[0]!];
    for (let i = 1; i < resolved.groupPath.length - 1; i++) {
      const child = parent?.pages?.[resolved.groupPath[i]!];
      if (!child || typeof child === 'string' || !('group' in child)) return next;
      parent = child;
    }
    if (!parent) return next;
    const pages = parent.pages ?? [];
    if (!parent.pages) parent.pages = pages;
    const idx = resolved.groupPath[resolved.groupPath.length - 1]!;
    pages[idx] = replacement as Group;
    return next;
  }

  // page
  const tab = tabs[resolved.tabIndex];
  if (!tab) return next;
  const groups = tab.groups ?? [];
  let group: Group | undefined = groups[resolved.pagePath[0]!];
  for (let i = 1; i < resolved.pagePath.length - 1; i++) {
    const child = group?.pages?.[resolved.pagePath[i]!];
    if (!child || typeof child === 'string' || !('group' in child)) return next;
    group = child;
  }
  if (!group) return next;
  const pages = group.pages ?? [];
  if (!group.pages) group.pages = pages;
  const idx = resolved.pagePath[resolved.pagePath.length - 1]!;
  pages[idx] = replacement as string | PageObject;
  return next;
}
