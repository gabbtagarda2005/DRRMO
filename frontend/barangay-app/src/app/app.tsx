import { createRootRoute, createRoute, createRouter, RouterProvider, Outlet, redirect } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './providers/AuthProvider';
import { ThemeProvider } from './providers/ThemeProvider';
import { RealtimeProvider } from './providers/RealtimeProvider';
import { RoleGuard } from './guards/RoleGuard';
import { USER_ROLES, STORAGE_KEYS } from '@shared/constants';
import { getFromStorage } from '@shared/utils';
import { DashboardLayout } from './layouts/DashboardLayout';
import { Dashboard } from '../pages/Dashboard';
import { Incidents } from '../pages/Incidents';
import { Login } from '../pages/Login';
import { Evacuations } from '../pages/Evacuations';
import { DamageAssessment } from '../pages/DamageAssessment';
import { Assistance } from '../pages/Assistance';
import { Alerts } from '../pages/Alerts';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 1000 * 60 * 5, gcTime: 1000 * 60 * 10 },
  },
});

function requireAuth() {
  if (!getFromStorage<string>(STORAGE_KEYS.AUTH_TOKEN)) {
    throw redirect({ to: '/login' });
  }
}

const rootRoute = createRootRoute({
  component: () => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <RealtimeProvider>
            <Outlet />
          </RealtimeProvider>
        </AuthProvider>
      </ThemeProvider>
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
      {import.meta.env.DEV ? <ReactQueryDevtools /> : null}
    </QueryClientProvider>
  ),
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  beforeLoad: () => {
    const token = getFromStorage<string>(STORAGE_KEYS.AUTH_TOKEN);
    throw redirect({ to: token ? '/dashboard' : '/login' });
  },
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  component: Login,
});

const authenticatedRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: 'authenticated',
  beforeLoad: requireAuth,
  component: () => (
    <RoleGuard allowedRoles={[USER_ROLES.BARANGAY_OFFICIAL]}>
      <DashboardLayout />
    </RoleGuard>
  ),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  authenticatedRoute.addChildren([
    createRoute({ getParentRoute: () => authenticatedRoute, path: '/dashboard', component: Dashboard }),
    createRoute({ getParentRoute: () => authenticatedRoute, path: '/incidents', component: Incidents }),
    createRoute({ getParentRoute: () => authenticatedRoute, path: '/evacuations', component: Evacuations }),
    createRoute({
      getParentRoute: () => authenticatedRoute,
      path: '/damage-assessment',
      component: DamageAssessment,
    }),
    createRoute({ getParentRoute: () => authenticatedRoute, path: '/assistance', component: Assistance }),
    createRoute({ getParentRoute: () => authenticatedRoute, path: '/alerts', component: Alerts }),
  ]),
]);

const router = createRouter({ routeTree });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export function App() {
  return <RouterProvider router={router} />;
}
