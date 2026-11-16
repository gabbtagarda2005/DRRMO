import 'package:go_router/go_router.dart';

import 'auth/auth_controller.dart';
import 'screens/alerts_screen.dart';
import 'screens/evacuations_screen.dart';
import 'screens/home_screen.dart';
import 'screens/hotlines_screen.dart';
import 'screens/report_emergency_screen.dart';
import 'screens/requests_screen.dart';
import 'shell/app_shell.dart';
import 'widgets/login_screen.dart';
import 'widgets/register_screen.dart';

GoRouter createCitizenRouter(AuthController auth) {
  return GoRouter(
    initialLocation: '/home',
    refreshListenable: auth,
    redirect: (context, state) {
      final onAuthScreen = state.matchedLocation == '/login' || state.matchedLocation == '/register';
      if (auth.isLoading) return null;
      if (!auth.isAuthenticated) return onAuthScreen ? null : '/login';
      if (onAuthScreen) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => AppShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [GoRoute(path: '/home', builder: (_, __) => const HomeScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/report', builder: (_, __) => const ReportEmergencyScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/requests', builder: (_, __) => const RequestsScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/alerts', builder: (_, __) => const AlertsScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/evacuations', builder: (_, __) => const EvacuationsScreen())]),
          StatefulShellBranch(routes: [GoRoute(path: '/hotlines', builder: (_, __) => const HotlinesScreen())]),
        ],
      ),
    ],
  );
}
