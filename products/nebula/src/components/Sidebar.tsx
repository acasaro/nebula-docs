import { NavLink } from 'react-router';
import { FileText, GitBranch, Github, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/settings/git', label: 'Git settings', icon: GitBranch, end: false },
  { to: '/settings/github-app', label: 'GitHub app', icon: Github, end: false },
];

export function Sidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border/40 bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center gap-2 border-b border-border/40 px-4">
        <FileText className="size-5 text-sidebar-primary" />
        <span className="text-base font-semibold tracking-tight">Nebula</span>
      </div>
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              )
            }
          >
            <Icon className="size-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
