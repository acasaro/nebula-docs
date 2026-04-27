import { Trash2, X } from 'lucide-react';
import type { OpenNavSettings } from '@/components/NavTree';

const PANEL_TITLE: Record<OpenNavSettings['kind'], string> = {
  page: 'Page settings',
  group: 'Group settings',
  tab: 'Tab settings',
};

interface NavSettingsPanelProps {
  settings: OpenNavSettings;
  onClose: () => void;
}

/**
 * Settings panel anchored to the right edge of the navigation column.
 *
 * Layout decisions:
 *   - `position: fixed` so the panel overlays the editor instead of pushing
 *     it. Editor content stays put when the panel opens/closes.
 *   - `left = appSidebar + repoBrowserSidebar` (`14rem + 18rem = 32rem`) so
 *     the panel sits flush against the navigation column.
 *   - Borders use `border/40` for a faint divider that doesn't fight with
 *     the `bg-muted/30` panel against `bg-background` editor.
 *   - `z-40` to sit above the editor surface and the AppShell header (which
 *     would otherwise show the mode toggle/branch picker through the panel).
 */
export function NavSettingsPanel({ settings, onClose }: NavSettingsPanelProps) {
  return (
    <aside
      className="fixed inset-y-0 z-40 flex w-[550px] flex-col overflow-hidden border-r border-border/20 bg-background"
      style={{ left: 'calc(14rem + 18rem)' }}
    >
      {/* Match the repo browser aside's surface exactly: an opaque bg-background
          base (so the editor content underneath doesn't bleed through) plus a
          bg-muted/30 alpha layer painted on top. Visible color is identical to
          the aside, which uses the same `bg-muted/30` over the page bg. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-muted/30"
      />
      <header className="relative z-10 flex h-12 shrink-0 items-center justify-between border-b border-border/20 px-4">
        <span className="text-sm font-semibold">{PANEL_TITLE[settings.kind]}</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label={`Delete ${settings.title}`}
            // Wire up the destructive action in a follow-up — visual only for now.
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
        <p className="mt-1 text-base font-semibold">{settings.title}</p>
        <p className="mt-6 rounded-md border border-dashed border-border/60 px-3 py-6 text-center text-sm text-muted-foreground">
          {PANEL_TITLE[settings.kind]} form coming next.
        </p>
      </div>
    </aside>
  );
}
