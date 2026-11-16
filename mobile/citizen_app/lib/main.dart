import 'package:drrmo_core/drrmo_core.dart';

import 'package:flutter/material.dart';

import 'package:go_router/go_router.dart';

import 'package:google_fonts/google_fonts.dart';

import 'package:provider/provider.dart';



import 'auth/auth_controller.dart';

import 'router.dart';

import 'sync/feature_sync_controller.dart';



void main() {

  WidgetsFlutterBinding.ensureInitialized();

  runApp(const CitizenApp());

}



class CitizenApp extends StatefulWidget {

  const CitizenApp({super.key});



  @override

  State<CitizenApp> createState() => _CitizenAppState();

}



class _CitizenAppState extends State<CitizenApp> {

  late final AuthController _auth;

  late final FeatureSyncController _featureSync;

  late final GoRouter _router;



  @override

  void initState() {

    super.initState();

    _auth = AuthController();

    _featureSync = FeatureSyncController();

    _router = createCitizenRouter(_auth);

    _bootstrap();

  }



  Future<void> _bootstrap() async {
    await _auth.bootstrap();
    await _featureSync.bootstrap(
      refreshSession: _auth.isAuthenticated ? _auth.refreshSession : null,
    );
  }



  @override

  void dispose() {

    _router.dispose();

    _featureSync.dispose();

    super.dispose();

  }



  @override

  Widget build(BuildContext context) {

    const theme = DrrmoTheme.citizen;

    return MultiProvider(

      providers: [

        ChangeNotifierProvider.value(value: _auth),

        ChangeNotifierProvider.value(value: _featureSync),

      ],

      child: MaterialApp.router(

        title: theme.brandName,

        theme: theme.toThemeData().copyWith(textTheme: GoogleFonts.interTextTheme(theme.toThemeData().textTheme)),

        routerConfig: _router,

        builder: (context, child) {
          return _AuthFeatureSyncListener(
            child: Consumer<AuthController>(
              builder: (context, auth, _) {
                if (auth.isLoading && !auth.isAuthenticated) {
                  return Material(
                    child: Center(child: CircularProgressIndicator(color: theme.primary)),
                  );
                }
                return child ?? const SizedBox.shrink();
              },
            ),
          );
        },

      ),

    );

  }
}

class _AuthFeatureSyncListener extends StatefulWidget {
  const _AuthFeatureSyncListener({required this.child});

  final Widget child;

  @override
  State<_AuthFeatureSyncListener> createState() => _AuthFeatureSyncListenerState();
}

class _AuthFeatureSyncListenerState extends State<_AuthFeatureSyncListener> {
  bool? _wasAuthenticated;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    if (auth.isLoading) return widget.child;

    final isAuth = auth.isAuthenticated;
    if (_wasAuthenticated == null) {
      _wasAuthenticated = isAuth;
      return widget.child;
    }

    if (isAuth && _wasAuthenticated == false) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        context.read<FeatureSyncController>().sync(refreshSession: auth.refreshSession);
      });
    }
    _wasAuthenticated = isAuth;
    return widget.child;
  }
}

