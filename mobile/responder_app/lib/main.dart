import 'package:drrmo_core/drrmo_core.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import 'auth/auth_controller.dart';
import 'router.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const ResponderApp());
}

class ResponderApp extends StatefulWidget {
  const ResponderApp({super.key});

  @override
  State<ResponderApp> createState() => _ResponderAppState();
}

class _ResponderAppState extends State<ResponderApp> {
  late final AuthController _auth;
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    _auth = AuthController();
    _router = createResponderRouter(_auth);
    _auth.bootstrap();
  }

  @override
  void dispose() {
    _router.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const theme = DrrmoTheme.responder;
    return ChangeNotifierProvider.value(
      value: _auth,
      child: MaterialApp.router(
        title: theme.brandName,
        theme: theme.toThemeData().copyWith(textTheme: GoogleFonts.interTextTheme(theme.toThemeData().textTheme)),
        routerConfig: _router,
        builder: (context, child) {
          return Consumer<AuthController>(
            builder: (context, auth, _) {
              if (auth.isLoading && !auth.isAuthenticated) {
                return Material(
                  child: Center(child: CircularProgressIndicator(color: theme.primary)),
                );
              }
              return child ?? const SizedBox.shrink();
            },
          );
        },
      ),
    );
  }
}
