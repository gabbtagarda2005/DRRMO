import 'package:drrmo_core/drrmo_core.dart';
import 'package:flutter/material.dart';

class AlertsScreen extends StatelessWidget {
  const AlertsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final items = [
      ('CRITICAL', 'Flood warning — low-lying areas', 'Evacuate to designated centers immediately.', StatusChipVariant.danger),
      ('ADVISORY', 'Heavy rainfall expected until 6 PM', 'Monitor local channels for updates.', StatusChipVariant.warning),
      ('INFO', 'Relief distribution schedule', 'Barangay hall · May 18, 9:00 AM', StatusChipVariant.info),
    ];

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: items.length,
      separatorBuilder: (_, __) => const SizedBox(height: 10),
      itemBuilder: (context, i) {
        final item = items[i];
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                StatusChip(label: item.$1, variant: item.$4),
                const SizedBox(height: 8),
                Text(item.$2, style: const TextStyle(fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(item.$3, style: const TextStyle(fontSize: 13, color: Color(0xFF64748B))),
              ],
            ),
          ),
        );
      },
    );
  }
}
