import { useNavigate } from 'react-router';
import { signOut, type User } from '@nebula-docs/firebase';
import { LogOut, Moon, Settings, Sun } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

function initialsFor(user: User): string {
  const source = user.displayName || user.email || '?';
  const letters = source
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');
  return letters.join('') || '?';
}

interface UserMenuProps {
  user: User;
}

export function UserMenu({ user }: UserMenuProps) {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    navigate('/sign-in', { replace: true });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
        <Avatar>
          {user.photoURL ? <AvatarImage src={user.photoURL} alt="" /> : null}
          <AvatarFallback>{initialsFor(user)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="text-sm font-medium">{user.displayName ?? 'Nebula user'}</span>
          {user.email ? (
            <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
          ) : null}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate('/settings/github')}>
          <Settings />
          GitHub settings
        </DropdownMenuItem>
        <div className="flex items-center justify-between px-2 py-1.5 text-sm">
          <span>Theme</span>
          <div className="flex items-center rounded-full border bg-muted/40 p-0.5">
            <button
              type="button"
              aria-label="Light theme"
              aria-pressed={theme === 'light'}
              onClick={(e) => {
                e.preventDefault();
                setTheme('light');
              }}
              className={cn(
                'flex size-7 items-center justify-center rounded-full transition-colors',
                theme === 'light'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Sun className="size-3.5" />
            </button>
            <button
              type="button"
              aria-label="Dark theme"
              aria-pressed={theme === 'dark'}
              onClick={(e) => {
                e.preventDefault();
                setTheme('dark');
              }}
              className={cn(
                'flex size-7 items-center justify-center rounded-full transition-colors',
                theme === 'dark'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              <Moon className="size-3.5" />
            </button>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
