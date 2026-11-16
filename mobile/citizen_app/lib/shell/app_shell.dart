import 'package:drrmo_core/drrmo_core.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../auth/auth_controller.dart';
import '../sync/feature_sync_controller.dart';
import 'citizen_nav.dart';

class AppShell extends StatelessWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  Future<void> _syncFeatures(BuildContext context) async {
    final auth = context.read<AuthController>();
    final sync = context.read<FeatureSyncController>();
    await sync.sync(
      refreshSession: auth.isAuthenticated ? auth.refreshSession : null,
    );
    if (!context.mounted) return;
    final message = sync.lastSyncMessage;
    if (message != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(message),
          behavior: SnackBarBehavior.floating,
          duration: const Duration(seconds: 3),
        ),
      );
      sync.clearSyncMessage();
    }
  }

  void _logout(BuildContext context) {
    context.read<AuthController>().logout();
  }

  @override
  Widget build(BuildContext context) {
    const theme = DrrmoTheme.citizen;
    final auth = context.watch<AuthController>();
    final sync = context.watch<FeatureSyncController>();

    final visibleNav = citizenNavItems.where((item) => sync.isEnabled(item.featureId)).toList();
    final currentBranch = navigationShell.currentIndex;
    final selectedNavIndex = visibleNav.indexWhere((item) => item.branchIndex == currentBranch);
    final safeSelectedIndex = selectedNavIndex >= 0 ? selectedNavIndex : 0;
    final title = selectedNavIndex >= 0 ? visibleNav[selectedNavIndex].title : 'DRRMO';

    return Scaffold(
      appBar: AppBar(
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        actions: [
          IconButton(
            tooltip: 'Sync new features',
            onPressed: sync.isSyncing ? null : () => _syncFeatures(context),
            icon: sync.isSyncing
                ? SizedBox(
                    width: 22,
                    height: 22,
                    child: CircularProgressIndicator(strokeWidth: 2, color: theme.primary),
                  )
                : const Icon(Icons.refresh),
          ),
          TextButton.icon(
            onPressed: () => _logout(context),
            icon: Icon(Icons.logout, size: 18, color: theme.primary),
            label: Text('Logout', style: TextStyle(color: theme.primary, fontWeight: FontWeight.w600)),
          ),
          PopupMenuButton<String>(
            onSelected: (v) {
              if (v == 'logout') _logout(context);
              if (v == 'sync') _syncFeatures(context);
            },
            itemBuilder: (_) => [
              PopupMenuItem(value: 'user', enabled: false, child: Text(auth.user?.fullName ?? 'Citizen')),
              PopupMenuItem(
                value: 'sync',
                child: Row(
                  children: [
                    Icon(Icons.refresh, size: 18, color: theme.primary),
                    const SizedBox(width: 8),
                    Text(sync.isSyncing ? 'Syncing…' : 'Sync features'),
                  ],
                ),
              ),
              const PopupMenuItem(value: 'logout', child: Text('Sign out')),
            ],
            child: Padding(
              padding: const EdgeInsets.only(right: 12),
              child: CircleAvatar(
                backgroundColor: theme.primary,
                child: Text(
                  auth.user?.firstName.isNotEmpty == true ? auth.user!.firstName[0].toUpperCase() : 'C',
                  style: const TextStyle(color: Colors.white),
                ),
              ),
            ),
          ),
        ],
      ),
      body: navigationShell,
      floatingActionButton: navigationShell.currentIndex == 0 && sync.isEnabled('sos_fab')
          ? FloatingActionButton.extended(
              onPressed: () => context.go('/report'),
              backgroundColor: theme.primary,
              icon: const Icon(Icons.sos, color: Colors.white),
              label: const Text('SOS / Report', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
            )
          : null,
      bottomNavigationBar: visibleNav.isEmpty
          ? null
          : NavigationBar(
              selectedIndex: safeSelectedIndex,
              onDestinationSelected: (index) => navigationShell.goBranch(visibleNav[index].branchIndex),
              destinations: [
                for (final item in visibleNav)
                  NavigationDestination(
                    icon: Icon(item.icon),
                    selectedIcon: Icon(item.selectedIcon),
                    label: item.label,
                  ),
              ],
            ),
    );
  }
}
