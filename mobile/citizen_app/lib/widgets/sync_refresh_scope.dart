import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../auth/auth_controller.dart';
import '../sync/feature_sync_controller.dart';

/// Pull-to-refresh wrapper that syncs features and session data.
class SyncRefreshScope extends StatelessWidget {
  const SyncRefreshScope({super.key, required this.child});

  final Widget child;

  Future<void> _onRefresh(BuildContext context) async {
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

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: () => _onRefresh(context),
      child: child,
    );
  }
}
