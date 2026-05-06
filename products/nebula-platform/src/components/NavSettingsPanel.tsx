import { Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { OpenNavSettings } from '@/components/NavTree';
import {
  GroupSettingsForm,
  type GroupConfigValues,
  PageSettingsForm,
  type PageConfigValues,
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
import type { IconValue as DocsIconValue } from '@/lib/docsConfig';
import {
  findEntry,
  type ResolvedEntry,
} from '@/lib/docsConfigOps';
import {
  splitFrontmatter,
} from '@/lib/frontmatter';
import type { DocsConfig, Group, PageObject, Tab } from '@/lib/docsConfig';
import type { IconValue as FormIconValue } from '@/components/IconField';

const PANEL_TITLE: Record<OpenNavSettings['kind'], string> = {
  page: 'Page settings',
  group: 'Group settings',
  tab: 'Tab settings',
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
}: NavSettingsPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const resolved = useMemo(
    () => (config ? findEntry(config, settings.key) : null),
    [config, settings.key],
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
}: {
  resolved: ResolvedEntry;
  settingsKey: string;
  onConfigChange: (updater: (config: DocsConfig) => DocsConfig) => void;
  pageDraft: { path: string; content: string } | null;
  onFrontmatterChange: (
    filePath: string,
    patch: Record<string, unknown>,
  ) => void;
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
    const onChange = (patch: Partial<TabConfigValues>) => {
      onConfigChange((config) =>
        replaceResolvedEntry(config, settingsKey, (e) =>
          e.kind === 'tab' ? mergeTab(e.tab, patch) : (e as ResolvedEntry),
        ),
      );
    };
    return <TabSettingsForm values={values} onChange={onChange} />;
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
    };
    const onChange = (patch: Partial<GroupConfigValues>) => {
      onConfigChange((config) =>
        replaceResolvedEntry(config, settingsKey, (e) =>
          e.kind === 'group' ? mergeGroup(e.group, patch) : (e as ResolvedEntry),
        ),
      );
    };
    return <GroupSettingsForm values={values} onChange={onChange} />;
  }

  // page
  const pageObj = resolved.pageObject;
  const stringEntry = !pageObj && typeof resolved.page === 'string'
    ? resolved.page
    : null;
  const slug = pageObj?.page ?? stringEntry ?? '';
  const configValues: PageConfigValues = {
    externalUrl: pageObj?.externalUrl ?? '',
    icon: docsIconToForm(pageObj?.icon),
    sidebarTitle: pageObj?.sidebarTitle ?? '',
    tag: pageObj?.tag ?? '',
    hidden: !!pageObj?.hidden,
  };
  const fmParsed =
    pageDraft && pageDraft.path === resolved.filePath
      ? splitFrontmatter(pageDraft.content).frontmatter
      : null;
  const fmValues: PageFrontmatterValues = {
    title: stringValue(fmParsed?.values.title) ?? '',
    description: stringValue(fmParsed?.values.description) ?? pageObj?.description ?? '',
    ogImage: stringValue(fmParsed?.values.ogImage) ?? pageObj?.ogImage ?? '',
    keywords: arrayValue(fmParsed?.values.keywords) ?? pageObj?.keywords ?? [],
    mode: stringValue(fmParsed?.values.mode) ?? pageObj?.mode ?? 'default',
  };
  const onConfigPatch = (patch: Partial<PageConfigValues>) => {
    onConfigChange((config) =>
      replaceResolvedEntry(config, settingsKey, (e) =>
        e.kind === 'page' ? mergePage(e.page, patch) : (e as ResolvedEntry),
      ),
    );
  };
  const onFmPatch = (patch: Partial<PageFrontmatterValues>) => {
    if (!pageDraft) return;
    onFrontmatterChange(pageDraft.path, patch);
  };
  return (
    <PageSettingsForm
      slug={slug}
      configValues={configValues}
      frontmatterValues={fmValues}
      onConfigChange={onConfigPatch}
      onFrontmatterChange={onFmPatch}
    />
  );
}

function stringValue(v: unknown): string | null {
  return typeof v === 'string' ? v : null;
}

function arrayValue(v: unknown): string[] | null {
  return Array.isArray(v) ? v.map(String) : null;
}

function docsIconToForm(icon: DocsIconValue | undefined): FormIconValue {
  if (!icon) return {};
  if (typeof icon === 'string') return { icon };
  return {
    icon: icon.name,
    iconLibrary: icon.library as FormIconValue['iconLibrary'],
    iconType: icon.style as FormIconValue['iconType'],
  };
}

function formIconToDocs(icon: FormIconValue): DocsIconValue | undefined {
  if (!icon.icon) return undefined;
  if (!icon.iconLibrary && !icon.iconType) return icon.icon;
  return {
    name: icon.icon,
    library: icon.iconLibrary,
    style: icon.iconType,
  };
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
  return next;
}

function mergePage(
  page: string | Group | PageObject,
  patch: Partial<PageConfigValues>,
): string | PageObject {
  // Normalize string entries to objects so we can carry config-level overrides.
  const base: PageObject =
    typeof page === 'string' ? { page } : 'group' in page ? { page: '' } : page;
  const next: PageObject = { ...base };
  if (patch.externalUrl !== undefined)
    next.externalUrl = patch.externalUrl ? patch.externalUrl : undefined;
  if (patch.icon !== undefined) next.icon = formIconToDocs(patch.icon);
  if (patch.sidebarTitle !== undefined)
    next.sidebarTitle = patch.sidebarTitle ? patch.sidebarTitle : undefined;
  if (patch.tag !== undefined) next.tag = patch.tag.trim() || undefined;
  if (patch.hidden !== undefined) next.hidden = patch.hidden || undefined;
  // If the entry was a plain string and no overrides remain, keep it a string
  // to preserve diff cleanliness.
  if (
    typeof page === 'string' &&
    !hasAnyDefinedField(next as unknown as Record<string, unknown>, ['page'])
  ) {
    return page;
  }
  return next;
}

function hasAnyDefinedField(
  obj: Record<string, unknown>,
  exceptKeys: string[],
): boolean {
  for (const [k, v] of Object.entries(obj)) {
    if (exceptKeys.includes(k)) continue;
    if (v !== undefined && v !== null && v !== '') return true;
  }
  return false;
}

function replaceResolvedEntry(
  config: DocsConfig,
  key: string,
  replacer: (resolved: ResolvedEntry) => unknown,
): DocsConfig {
  const resolved = findEntry(config, key);
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
