import 'package:drrmo_core/drrmo_core.dart';
import 'package:flutter/material.dart';

class AssignmentsScreen extends StatelessWidget {
  const AssignmentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _AssignmentCard(
          title: 'Flood rescue — Riverside Block 4',
          status: 'Active',
          variant: StatusChipVariant.warning,
          time: 'Assigned 14 min ago',
        ),
        const SizedBox(height: 10),
        _AssignmentCard(
          title: 'Medical evacuation — Zone B',
          status: 'Completed',
          variant: StatusChipVariant.success,
          time: 'Closed today 9:42 AM',
        ),
      ],
    );
  }
}

class _AssignmentCard extends StatelessWidget {
  const _AssignmentCard({
    required this.title,
    required this.status,
    required this.variant,
    required this.time,
  });

  final String title;
  final String status;
  final StatusChipVariant variant;
  final String time;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white)),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              StatusChip(label: status, variant: variant),
              const SizedBox(height: 6),
              Text(time, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
            ],
          ),
        ),
        trailing: const Icon(Icons.chevron_right, color: Color(0xFF64748B)),
      ),
    );
  }
}
