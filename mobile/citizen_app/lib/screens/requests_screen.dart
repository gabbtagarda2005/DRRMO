import 'package:drrmo_core/drrmo_core.dart';
import 'package:flutter/material.dart';

class RequestsScreen extends StatelessWidget {
  const RequestsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const theme = DrrmoTheme.citizen;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Expanded(
                      child: Text('Flood — Block 4', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                    StatusChip(label: 'Dispatched', variant: StatusChipVariant.warning),
                  ],
                ),
                const SizedBox(height: 16),
                ProgressTracker(
                  accentColor: theme.primary,
                  currentIndex: 2,
                  steps: const [
                    ProgressStep(label: 'Reported'),
                    ProgressStep(label: 'Verified'),
                    ProgressStep(label: 'Responders dispatched'),
                    ProgressStep(label: 'Resolved'),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        const Card(
          child: ListTile(
            leading: Icon(Icons.history, color: Color(0xFF94A3B8)),
            title: Text('Medical assistance — May 12'),
            subtitle: Text('Resolved · ER-089'),
            trailing: StatusChip(label: 'Resolved', variant: StatusChipVariant.success),
          ),
        ),
      ],
    );
  }
}
