import { HeaderSlotProvider } from "@/components/HeaderSlot";
import { Sidebar } from "@/components/Sidebar";
import { UserMenu } from "@/components/UserMenu";
import { env } from "@/lib/env";
import { useEditorNavWidth } from "@/lib/uiPrefs";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@nebula-docs/firebase";
import { Outlet } from "react-router";

export function AppShell() {
  const auth = useCurrentUser();
  const [editorNavWidth] = useEditorNavWidth();

  return (
    <HeaderSlotProvider
      render={({ slot, leading }) => (
        <div className='flex min-h-screen bg-background text-foreground'>
          <Sidebar />
          <div className='flex flex-1 flex-col'>
            <header className='flex h-12 items-stretch bg-background'>
              {leading ? (
                <div
                  style={{ width: editorNavWidth }}
                  className='flex shrink-0 items-center border-r border-b border-border/40 bg-muted/30 px-3'>
                  {leading}
                </div>
              ) : null}
              <div
                className={cn(
                  "flex flex-1 items-center gap-3 min-w-0 px-2.5",
                  !leading && "border-b",
                )}>
                {slot}
              </div>
              <div className={cn("flex shrink-0 items-center gap-2 pr-6", !leading && "border-b")}>
                {env.isLocalBackend ? (
                  <span
                    title={`Editing tenants/${env.localTenant}/ on disk`}
                    className='rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-400'>
                    Local · {env.localTenant}
                  </span>
                ) : null}
                {env.isDev ? (
                  <span
                    title={`NEBULA_ENV=${env.mode}`}
                    className='rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400'>
                    Dev
                  </span>
                ) : null}
                {auth.status === "authenticated" ? <UserMenu user={auth.user} /> : null}
              </div>
            </header>
            <main className='flex-1 p-8'>
              <Outlet />
            </main>
          </div>
        </div>
      )}>
      {null}
    </HeaderSlotProvider>
  );
}
