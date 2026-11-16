import 'package:drrmo_core/drrmo_core.dart';
import 'package:flutter/material.dart';

class IncidentsScreen extends StatefulWidget {
  const IncidentsScreen({super.key});

  @override
  State<IncidentsScreen> createState() => _IncidentsScreenState();
}

class _IncidentsScreenState extends State<IncidentsScreen> {
  int _statusIndex = 1;

  static const _statuses = [
    'On the way',
    'Arrived on site',
    'Rescue operations active',
    'Mission completed',
  ];

  @override
  Widget build(BuildContext context) {
    const theme = DrrmoTheme.responder;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Mission terminal', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white)),
                const SizedBox(height: 12),
                const Text('Flood rescue — Riverside Block 4', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: Colors.white)),
                const SizedBox(height: 8),
                const Text('Riverside Ave, near footbridge', style: TextStyle(color: Color(0xFF94A3B8))),
                const SizedBox(height: 4),
                const Text('Reporter: trapped residents on 2nd floor. Water rising.', style: TextStyle(fontSize: 13, color: Color(0xFFCBD5E1))),
                const SizedBox(height: 16),
                ProgressTracker(
                  isDark: true,
                  accentColor: theme.primary,
                  currentIndex: _statusIndex,
                  steps: _statuses.map((s) => ProgressStep(label: s)).toList(),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: theme.primary,
                      foregroundColor: const Color(0xFF0F172A),
                    ),
                    onPressed: () {
                      if (_statusIndex < _statuses.length - 1) {
                        setState(() => _statusIndex++);
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Mission marked complete')),
                        );
                      }
                    },
                    child: Text(
                      _statusIndex < _statuses.length - 1
                          ? 'Update: ${_statuses[_statusIndex + 1]}'
                          : 'Mission completed',
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
