import 'package:go_router/go_router.dart';

import 'auth/auth_controller.dart';
import 'screens/assignments_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/incidents_screen.dart';
import 'screens/maps_screen.dart';
import 'screens/reports_screen.dart';
import 'shell/app_shell.dart';
import 'widgets/login_screen.dart';

GoRouter createResponderRouter(AuthController auth) {
  return GoRouter(
    initialLocation: '/dashboard',
    refreshListenable: auth,
    redirect: (context, state) {
      final loggingIn = state.matchedLocation == '/login';
      if (auth.isLoading) return null;
      if (!auth.isAuthenticated) return loggingIn ? null : '/login';
      if (loggingIn) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => AppShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [GoRoute(path: '/dashboard', builder: (_, __) => const DashboardScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/assignments', builder: (_, __) => const AssignmentsScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/incidents', builder: (_, __) => const IncidentsScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/reports', builder: (_, __) => const ReportsScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/maps', builder: (_, __) => const MapsScreen())]),
        ],
      ),
    ],
  );
}
