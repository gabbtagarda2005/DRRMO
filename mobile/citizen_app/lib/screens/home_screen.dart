import 'package:drrmo_core/drrmo_core.dart';

import 'package:flutter/material.dart';

import 'package:go_router/go_router.dart';

import 'package:provider/provider.dart';



import '../sync/feature_sync_controller.dart';
import '../widgets/sync_refresh_scope.dart';



class HomeScreen extends StatelessWidget {

  const HomeScreen({super.key});



  @override

  Widget build(BuildContext context) {

    const theme = DrrmoTheme.citizen;

    final sync = context.watch<FeatureSyncController>();



    return SyncRefreshScope(
      child: ListView(
      physics: const AlwaysScrollableScrollPhysics(),

      padding: const EdgeInsets.fromLTRB(16, 16, 16, 100),

      children: [

        Card(

          color: const Color(0xFFFFF1F2),

          shape: RoundedRectangleBorder(

            borderRadius: BorderRadius.circular(16),

            side: const BorderSide(color: Color(0xFFFECACA)),

          ),

          child: Padding(

            padding: const EdgeInsets.all(16),

            child: Row(

              children: [

                Icon(Icons.shield_outlined, color: theme.primary, size: 32),

                const SizedBox(width: 12),

                const Expanded(

                  child: Column(

                    crossAxisAlignment: CrossAxisAlignment.start,

                    children: [

                      Text('Stay prepared', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),

                      SizedBox(height: 4),

                      Text(

                        'Tap the red SOS button to report emergencies. Pull down or tap refresh to sync new features.',

                        style: TextStyle(fontSize: 13, color: Color(0xFF64748B)),

                      ),

                    ],

                  ),

                ),

              ],

            ),

          ),

        ),

        if (sync.lastSyncedAt != null) ...[

          const SizedBox(height: 8),

          Text(

            'Features v${sync.manifestVersion} · Last synced ${_formatSyncTime(sync.lastSyncedAt!)}',

            style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),

            textAlign: TextAlign.center,

          ),

        ],

        const SizedBox(height: 16),

        if (sync.isEnabled('home_stats')) ...[

          StatCard(

            label: 'Active advisories',

            value: '2',

            hint: '1 critical in your area',

            icon: Icons.notifications_outlined,

            theme: theme,

          ),

          const SizedBox(height: 12),

          StatCard(

            label: 'Open requests',

            value: '1',

            hint: 'Tracking in progress',

            icon: Icons.sensors_outlined,

            theme: theme,

          ),

          const SizedBox(height: 20),

        ],

        if (sync.isEnabled('quick_access')) ...[

          const Text(

            'QUICK ACCESS',

            style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, letterSpacing: 1, color: Color(0xFF64748B)),

          ),

          const SizedBox(height: 12),

          Row(

            children: [

              if (sync.isEnabled('quick_access_hotlines'))

                Expanded(child: _QuickTile(icon: Icons.phone, label: 'Hotlines', onTap: () => context.go('/hotlines'))),

              if (sync.isEnabled('quick_access_hotlines') &&

                  (sync.isEnabled('quick_access_advisories') || sync.isEnabled('quick_access_safe_zones')))

                const SizedBox(width: 8),

              if (sync.isEnabled('quick_access_advisories'))

                Expanded(child: _QuickTile(icon: Icons.campaign_outlined, label: 'Advisories', onTap: () => context.go('/alerts'))),

              if (sync.isEnabled('quick_access_advisories') && sync.isEnabled('quick_access_safe_zones'))

                const SizedBox(width: 8),

              if (sync.isEnabled('quick_access_safe_zones'))

                Expanded(child: _QuickTile(icon: Icons.map_outlined, label: 'Safe zones', onTap: () => context.go('/evacuations'))),

            ],

          ),

          const SizedBox(height: 20),

        ],

        if (sync.isEnabled('request_tracker'))

          Card(

            child: Padding(

              padding: const EdgeInsets.all(16),

              child: Column(

                crossAxisAlignment: CrossAxisAlignment.start,

                children: [

                  const Text('Latest request status', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),

                  const SizedBox(height: 16),

                  ProgressTracker(

                    accentColor: theme.primary,

                    currentIndex: 2,

                    steps: const [

                      ProgressStep(label: 'Reported', description: 'Your report was received'),

                      ProgressStep(label: 'Verified', description: 'Barangay official confirmed'),

                      ProgressStep(label: 'Responders dispatched', description: 'Team en route'),

                      ProgressStep(label: 'Resolved', description: 'Incident closed'),

                    ],

                  ),

                  TextButton(

                    onPressed: () => context.go('/requests'),

                    child: const Text('View all requests'),

                  ),

                ],

              ),

            ),

          ),

      ],
    ),
    );

  }



  static String _formatSyncTime(DateTime time) {

    final diff = DateTime.now().difference(time);

    if (diff.inMinutes < 1) return 'just now';

    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';

    if (diff.inHours < 24) return '${diff.inHours}h ago';

    return '${diff.inDays}d ago';

  }

}



class _QuickTile extends StatelessWidget {

  const _QuickTile({required this.icon, required this.label, required this.onTap});



  final IconData icon;

  final String label;

  final VoidCallback onTap;



  @override

  Widget build(BuildContext context) {

    return InkWell(

      onTap: onTap,

      borderRadius: BorderRadius.circular(16),

      child: Card(

        child: Padding(

          padding: const EdgeInsets.symmetric(vertical: 16),

          child: Column(

            children: [

              Icon(icon, color: DrrmoTheme.citizen.primary),

              const SizedBox(height: 8),

              Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500)),

            ],

          ),

        ),

      ),

    );

  }

}


