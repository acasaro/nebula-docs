import { Outlet } from 'react-router';
import { useCurrentUser } from '@nebula/firebase';
import { Sidebar } from '@/components/Sidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { UserMenu } from '@/components/UserMenu';

export function AppShell() {
  const auth = useCurrentUser();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-end gap-2 border-b bg-background px-6">
          <ThemeToggle />
          {auth.status === 'authenticated' ? <UserMenu user={auth.user} /> : null}
        </header>
        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
