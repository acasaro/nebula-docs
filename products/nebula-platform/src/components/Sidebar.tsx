import { NavLink } from 'react-router';
import {
  BarChart3,
  ChevronsLeft,
  ChevronsRight,
  GitBranch,
  Github,
  Home,
  Image as ImageIcon,
  PenLine,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useGitSettings } from '@/lib/gitSettings';
import { useMainNavCollapsed } from '@/lib/uiPrefs';

export function Sidebar() {
  const settings = useGitSettings();
  const editorBranch =
    settings.status === 'ready' ? settings.settings.defaultBranch : 'main';
  const [collapsed, setCollapsed] = useMainNavCollapsed();

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
    { to: '/analytics', label: 'Analytics', icon: BarChart3, end: false },
    { to: '/assets', label: 'Assets', icon: ImageIcon, end: false },
    { to: '/settings/git', label: 'Git settings', icon: GitBranch, end: false },
    { to: '/settings/github-app', label: 'GitHub app', icon: Github, end: false },
  ];

  return (
    <aside
      className={cn(
        'flex shrink-0 flex-col border-r border-border/40 bg-sidebar text-sidebar-foreground transition-[width] duration-150 ease-out',
        collapsed ? 'w-14' : 'w-56',
      )}
    >
      <div
        className={cn(
          'flex h-12 items-center border-b border-border/40 overflow-hidden',
          collapsed ? 'justify-center px-0' : 'px-4',
        )}
      >
        {/* The wordmark SVG is laid out icon-then-text. When collapsed we crop
            the parent to ~24px wide and lock the SVG to its left edge so only
            the orbit glyph shows; expanded, the same SVG renders in full. */}
        <div className={cn('flex h-6 items-center', collapsed ? 'w-6' : 'w-auto')}>
          <img
            src='/nebula-wordmark-light.svg'
            alt='Nebula'
            className='h-6 w-auto max-w-none select-none dark:hidden'
            draggable={false}
          />
          <img
            src='/nebula-wordmark-dark.svg'
            alt='Nebula'
            className='hidden h-6 w-auto max-w-none select-none dark:block'
            draggable={false}
          />
        </div>
      </div>
      <nav className={cn('flex flex-col gap-1 p-2', collapsed && 'items-center')}>
        {navItems.map(({ to, label, icon: Icon, end, activePrefix }) => (
          <NavLink
            key={label}
            to={to}
            end={end}
            title={collapsed ? label : undefined}
            aria-label={collapsed ? label : undefined}
            className={({ isActive }) => {
              const matched =
                isActive ||
                (activePrefix
                  ? window.location.pathname.startsWith(activePrefix)
                  : false);
              return cn(
                'flex items-center rounded-md text-sm transition-colors',
                collapsed
                  ? 'h-9 w-9 justify-center'
                  : 'gap-2 px-3 py-2',
                matched
                  ? 'bg-sidebar-accent font-semibold text-brand-text'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              );
            }}
          >
            <Icon className='size-4' />
            {collapsed ? null : label}
          </NavLink>
        ))}
      </nav>
      <button
        type='button'
        onClick={() => setCollapsed(!collapsed)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-pressed={collapsed}
        className={cn(
          'mt-auto flex h-9 items-center text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground',
          collapsed ? 'mx-auto mb-2 w-9 justify-center' : 'mx-2 mb-2 gap-2 rounded-md px-3 hover:bg-sidebar-accent',
        )}
      >
        {collapsed ? (
          <ChevronsRight className='size-4' />
        ) : (
          <>
            <ChevronsLeft className='size-4' />
            <span className='text-xs'>Collapse</span>
          </>
        )}
      </button>
    </aside>
  );
}
