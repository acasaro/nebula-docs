import { HeaderSlotProvider } from "@/components/HeaderSlot";
import { Sidebar } from "@/components/Sidebar";
import { UserMenu } from "@/components/UserMenu";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@nebula/firebase";
import { Outlet } from "react-router";

export function AppShell() {
  const auth = useCurrentUser();

  return (
    <HeaderSlotProvider
      render={({ slot, leading }) => (
        <div className='flex min-h-screen bg-background text-foreground'>
          <Sidebar />
          <div className='flex flex-1 flex-col'>
            <header className='flex h-12 items-stretch bg-background'>
              {leading ? (
                <div className='flex w-72 shrink-0 items-center border-r border-b border-border/40 bg-muted/30 px-3'>
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
