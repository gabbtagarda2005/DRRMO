import 'package:drrmo_core/drrmo_core.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key, this.hasMission = true});

  final bool hasMission;

  @override
  Widget build(BuildContext context) {
    const theme = DrrmoTheme.responder;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const StatCard(
          label: 'Shift status',
          value: 'On duty',
          hint: 'Since 6:00 AM',
          icon: Icons.sensors,
          theme: theme,
        ),
        const SizedBox(height: 12),
        const StatCard(
          label: 'Assignments today',
          value: '2',
          hint: '1 active',
          icon: Icons.navigation_outlined,
          theme: theme,
        ),
        const SizedBox(height: 12),
        const StatCard(
          label: 'Avg. response',
          value: '14m',
          hint: 'Within SLA',
          icon: Icons.schedule,
          theme: theme,
        ),
        const SizedBox(height: 20),
        if (hasMission)
          Card(
            color: const Color(0xFF0F172A),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: theme.primary.withValues(alpha: 0.4)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'ACTIVE MISSION',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1,
                      color: theme.primary,
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    'Flood rescue — Riverside Block 4',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                  const SizedBox(height: 8),
                  const Row(
                    children: [
                      Icon(Icons.pin_drop_outlined, size: 16, color: Color(0xFF94A3B8)),
                      SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          '14.6012° N, 120.9821° E · Priority critical',
                          style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: FilledButton(
                          style: FilledButton.styleFrom(
                            backgroundColor: theme.primary,
                            foregroundColor: const Color(0xFF0F172A),
                          ),
                          onPressed: () => context.go('/incidents'),
                          child: const Text('Open mission terminal'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () => context.go('/maps'),
                          child: const Text('View route'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          )
        else
          Card(
            color: const Color(0xFF0F172A),
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                children: [
                  Icon(Icons.sensors_off, size: 48, color: Colors.grey.shade700),
                  const SizedBox(height: 12),
                  const Text('Standing by', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600, color: Color(0xFFCBD5E1))),
                  const SizedBox(height: 4),
                  Text(
                    'No active assignments. You will be notified when dispatched.',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
