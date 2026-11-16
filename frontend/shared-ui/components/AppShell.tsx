import { useState, type ReactNode } from 'react';
import { Link, useLocation } from '@tanstack/react-router';
import { Menu, X, Moon, Sun, LogOut, Wifi, WifiOff } from 'lucide-react';
import { roleProfiles, type RoleProfileKey } from '@shared/roleProfiles';
import { appThemes } from '../themes';
import { getNavIcon } from '../lib/navIcons';
import { cn } from '../lib/cn';
import { humanize } from '@shared/src/format';
import { usePageTitle } from '../context/PageTitleContext';

interface AppShellProps {
  profileKey: RoleProfileKey;
  userName?: string;
  userRole?: string;
  isConnected?: boolean;
  themeMode?: 'light' | 'dark';
  onToggleTheme?: () => void;
  onLogout?: () => void;
  headerExtra?: ReactNode;
  floatingAction?: ReactNode;
  children: ReactNode;
}

export function AppShell({
  profileKey,
  userName,
  userRole,
  isConnected = true,
  themeMode = 'light',
  onToggleTheme,
  onLogout,
  headerExtra,
  floatingAction,
  children,
}: AppShellProps) {
  const profile = roleProfiles[profileKey];
  const theme = appThemes[profileKey];
  const location = useLocation();
  const { title: pageTitle } = usePageTitle();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const dark = themeMode === 'dark';

  const navContent = (
    <nav className="mt-6 space-y-1">
      {profile.navigation.map((item) => {
        const active = location.pathname === item.path;
        const Icon = getNavIcon(item);
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setSidebarOpen(false)}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
              active
                ? dark
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'text-white shadow-sm'
                : dark
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            )}
            style={
              active && !dark
                ? { backgroundColor: theme.accent, color: theme.accentText }
                : undefined
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div
      className={cn(
        'flex min-h-screen font-sans antialiased',
        dark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50/50 text-slate-800'
      )}
    >
      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        />
      ) : null}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 border-r px-4 py-6 shadow-sm transition-transform lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0',
          dark ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-white',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100/80 px-2 pb-6 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={cn('flex h-9 w-9 items-center justify-center rounded-lg font-bold text-white', theme.sidebarLogo)}
            >
              D
            </div>
            <div>
              <span className={cn('font-bold tracking-tight block', dark ? 'text-white' : 'text-slate-900')}>
                {profile.brandName}
              </span>
              <span className={cn('text-[10px] uppercase tracking-wider', dark ? 'text-slate-500' : 'text-slate-400')}>
                {profile.platform}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden text-slate-500"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {navContent}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            'sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 sm:px-8',
            dark
              ? 'border-slate-800 bg-slate-900/80 backdrop-blur-md'
              : 'border-slate-100 bg-white/80 backdrop-blur-md'
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              className="lg:hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1
              className={cn(
                'truncate text-lg font-semibold tracking-tight sm:text-xl',
                dark ? 'text-white' : 'text-slate-900'
              )}
            >
              {pageTitle}
            </h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {headerExtra}
            <span
              className={cn(
                'hidden sm:inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset',
                isConnected
                  ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
                  : 'bg-red-50 text-red-700 ring-red-600/20'
              )}
            >
              {isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              {isConnected ? 'Live' : 'Offline'}
            </span>
            {onToggleTheme ? (
              <button
                type="button"
                onClick={onToggleTheme}
                className={cn(
                  'rounded-lg p-2 transition',
                  dark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-500 hover:bg-slate-100'
                )}
              >
                {themeMode === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>
            ) : null}
            {userName ? (
              <div className="hidden md:block text-right">
                <p className={cn('text-sm font-medium', dark ? 'text-white' : 'text-slate-900')}>{userName}</p>
                {userRole ? (
                  <p className={cn('text-xs', dark ? 'text-slate-500' : 'text-slate-500')}>
                    {humanize(userRole)}
                  </p>
                ) : null}
              </div>
            ) : null}
            {onLogout ? (
              <button
                type="button"
                onClick={onLogout}
                className={cn(
                  'rounded-lg p-2 transition',
                  dark ? 'text-slate-400 hover:bg-slate-800 hover:text-red-400' : 'text-slate-500 hover:bg-slate-100 hover:text-red-600'
                )}
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            ) : null}
          </div>
        </header>

        <main className="relative flex-1 overflow-y-auto p-4 sm:p-8">{children}</main>
      </div>

      {floatingAction}
    </div>
  );
}
