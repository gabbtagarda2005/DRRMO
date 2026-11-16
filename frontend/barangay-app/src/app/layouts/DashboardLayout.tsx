import { Outlet } from '@tanstack/react-router';
import { AppShell, PageTitleProvider } from '@drrmo/ui';
import { useAuth } from '../providers/AuthProvider';
import { useTheme } from '../providers/ThemeProvider';
import { useRealtime } from '../providers/RealtimeProvider';

const PROFILE_KEY = 'barangay_official' as const;

export function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { isConnected } = useRealtime();
  const themeMode = theme === 'dark' ? 'dark' : 'light';

  return (
    <PageTitleProvider defaultTitle="Barangay Dashboard">
      <AppShell
        profileKey={PROFILE_KEY}
        userName={user ? `${user.firstName} ${user.lastName}` : undefined}
        userRole={user?.role}
        isConnected={isConnected}
        themeMode={themeMode}
        onToggleTheme={toggleTheme}
        onLogout={logout}
      >
        <Outlet />
      </AppShell>
    </PageTitleProvider>
  );
}
