import 'package:drrmo_core/drrmo_core.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../auth/auth_controller.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  void _logout(BuildContext context) {
    context.read<AuthController>().logout();
  }

  @override
  Widget build(BuildContext context) {
    const theme = DrrmoTheme.responder;
    final auth = context.watch<AuthController>();
    final titles = ['Field Dashboard', 'Assignments', 'Operations', 'Field Reports', 'Route Map'];
    final title = navigationShell.currentIndex < titles.length ? titles[navigationShell.currentIndex] : 'Responder';

    return Scaffold(
      appBar: AppBar(
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        actions: [
          TextButton.icon(
            onPressed: () => _logout(context),
            icon: Icon(Icons.logout, size: 18, color: theme.primary),
            label: Text('Logout', style: TextStyle(color: theme.primary, fontWeight: FontWeight.w600)),
          ),
          PopupMenuButton<String>(
            onSelected: (v) {
              if (v == 'logout') _logout(context);
            },
            itemBuilder: (_) => [
              PopupMenuItem(value: 'user', enabled: false, child: Text(auth.user?.fullName ?? 'Responder')),
              const PopupMenuItem(value: 'logout', child: Text('Sign out')),
            ],
            child: Padding(
              padding: const EdgeInsets.only(right: 12),
              child: CircleAvatar(
                backgroundColor: theme.primary,
                child: Text(
                  auth.user?.firstName.isNotEmpty == true ? auth.user!.firstName[0].toUpperCase() : 'R',
                  style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
        ],
      ),
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: navigationShell.goBranch,
        destinations: const [
          NavigationDestination(icon: Icon(Icons.dashboard_outlined), selectedIcon: Icon(Icons.dashboard), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.assignment_outlined), selectedIcon: Icon(Icons.assignment), label: 'Tasks'),
          NavigationDestination(icon: Icon(Icons.emergency_outlined), selectedIcon: Icon(Icons.emergency), label: 'Mission'),
          NavigationDestination(icon: Icon(Icons.description_outlined), selectedIcon: Icon(Icons.description), label: 'Reports'),
          NavigationDestination(icon: Icon(Icons.map_outlined), selectedIcon: Icon(Icons.map), label: 'Map'),
        ],
      ),
    );
  }
}
