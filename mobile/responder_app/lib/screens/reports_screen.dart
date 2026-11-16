import 'package:flutter/material.dart';

class ReportsScreen extends StatelessWidget {
  const ReportsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text(
          'Field report & attachments',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white),
        ),
        const SizedBox(height: 8),
        const Text(
          'Upload tactical sitreps and multimedia logs to command.',
          style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8)),
        ),
        const SizedBox(height: 16),
        TextField(
          maxLines: 4,
          style: const TextStyle(color: Colors.white),
          decoration: const InputDecoration(hintText: 'Quick sitrep from the ground...'),
        ),
        const SizedBox(height: 12),
        Container(
          height: 120,
          alignment: Alignment.center,
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFF334155)),
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.photo_camera_outlined, color: Color(0xFF64748B), size: 36),
              SizedBox(height: 8),
              Text('Capture photo / video (simulated)', style: TextStyle(color: Color(0xFF94A3B8))),
            ],
          ),
        ),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: () {},
          child: const Text('Send to command station'),
        ),
      ],
    );
  }
}
