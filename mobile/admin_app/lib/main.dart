import 'package:flutter/material.dart';
import 'package:drrmo_core/drrmo_core.dart';
import 'widgets/login_screen.dart';

void main() {
  runApp(const AdminApp());
}

class AdminApp extends StatelessWidget {
  const AdminApp({super.key});

  @override
  Widget build(BuildContext context) {
    final theme = DrrmoTheme.responder.toThemeData();
    return MaterialApp(
      title: 'DRRMO Admin',
      theme: theme,
      home: const LoginScreen(),
    );
  }
}
