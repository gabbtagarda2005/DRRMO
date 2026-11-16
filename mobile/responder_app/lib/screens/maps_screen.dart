import 'package:drrmo_core/drrmo_core.dart';
import 'package:flutter/material.dart';

class MapsScreen extends StatelessWidget {
  const MapsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    const theme = DrrmoTheme.responder;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: Container(
            height: 280,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              gradient: LinearGradient(
                colors: [const Color(0xFF1E293B), theme.primary.withValues(alpha: 0.2)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: const Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.map_outlined, size: 56, color: Color(0xFF94A3B8)),
                SizedBox(height: 12),
                Text('Route map (simulated)', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                SizedBox(height: 4),
                Text('GPS navigation integrates here', style: TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        Card(
          child: ListTile(
            leading: Icon(Icons.navigation, color: theme.primary),
            title: Text('Destination', style: TextStyle(color: Colors.white)),
            subtitle: Text('Riverside Block 4 · 2.4 km · ~8 min', style: TextStyle(color: Color(0xFF94A3B8))),
          ),
        ),
      ],
    );
  }
}
