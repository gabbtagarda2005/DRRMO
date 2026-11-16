import 'package:flutter/material.dart';

class EvacuationsScreen extends StatelessWidget {
  const EvacuationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final centers = [
      ('Barangay Hall Gym', '0.8 km', '42%', 210, 500),
      ('Elementary School Covered Court', '1.2 km', '78%', 390, 500),
      ('Community Center', '2.1 km', 'Open', 45, 300),
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: centers.length,
      itemBuilder: (context, i) {
        final c = centers[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            contentPadding: const EdgeInsets.all(16),
            leading: const CircleAvatar(
              backgroundColor: Color(0xFFFEE2E2),
              child: Icon(Icons.home_work_outlined, color: Color(0xFFDC2626)),
            ),
            title: Text(c.$1, style: const TextStyle(fontWeight: FontWeight.w600)),
            subtitle: Text('${c.$2} away · Occupancy ${c.$3} (${c.$4}/${c.$5})'),
            trailing: const Icon(Icons.chevron_right),
          ),
        );
      },
    );
  }
}
