import 'package:flutter/material.dart';

class HotlinesScreen extends StatelessWidget {
  const HotlinesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const hotlines = [
      ('DRRMO Command Center', '911 / (02) 8888-DRRM'),
      ('Fire Department', '160'),
      ('Police', '117'),
      ('Medical / Ambulance', '143'),
      ('Barangay Emergency Desk', '(02) 8123-4567'),
    ];

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: hotlines.length,
      itemBuilder: (context, i) {
        final h = hotlines[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 10),
          child: ListTile(
            leading: const Icon(Icons.phone_in_talk, color: Color(0xFFDC2626)),
            title: Text(h.$1),
            subtitle: Text(h.$2),
            trailing: IconButton(
              icon: const Icon(Icons.call),
              color: const Color(0xFFDC2626),
              onPressed: () {},
            ),
          ),
        );
      },
    );
  }
}
