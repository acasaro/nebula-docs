import { NavLink } from 'react-router';
import { GitBranch, Github, Home, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGitSettings } from '@/lib/gitSettings';

export function Sidebar() {
  const settings = useGitSettings();
  const editorBranch =
    settings.status === 'ready' ? settings.settings.defaultBranch : 'main';

  const navItems = [
    { to: '/', label: 'Home', icon: Home, end: true },
    {
      to: `/editor/${editorBranch}`,
      label: 'Editor',
      icon: PenLine,
      end: false,
      // /editor/:branch/~/<path> should keep "Editor" highlighted
      activePrefix: '/editor/',
    },
    { to: '/settings/git', label: 'Git settings', icon: GitBranch, end: false },
    { to: '/settings/github-app', label: 'GitHub app', icon: Github, end: false },
  ];

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border/40 bg-sidebar text-sidebar-foreground">
      <div className="flex h-12 items-center border-b border-border/40 px-4">
        <img
          src="/nebula-wordmark-light.svg"
          alt="Nebula"
          className="h-6 w-auto select-none dark:hidden"
          draggable={false}
        />
        <img
          src="/nebula-wordmark-dark.svg"
          alt="Nebula"
          className="hidden h-6 w-auto select-none dark:block"
          draggable={false}
        />
      </div>
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map(({ to, label, icon: Icon, end, activePrefix }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
            className={({ isActive }) => {
              const matched =
                isActive ||
                (activePrefix
                  ? window.location.pathname.startsWith(activePrefix)
                  : false);
              return cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                matched
                  ? 'bg-sidebar-accent font-semibold text-brand-text'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              );
            }}
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
