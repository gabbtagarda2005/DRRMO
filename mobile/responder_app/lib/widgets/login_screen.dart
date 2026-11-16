import 'dart:ui';
import 'dart:convert';

import 'package:drrmo_core/drrmo_core.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../auth/auth_controller.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  static const demoEmail = 'responder1@drmmo.gov.ph';
  static const demoPassword = 'DRRMO123';

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _showPassword = false;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final auth = context.read<AuthController>();
    await auth.login(_email.text.trim(), _password.text);
  }

  @override
  Widget build(BuildContext context) {
    final theme = DrrmoTheme.responder;
    final auth = context.watch<AuthController>();
    final accent = theme.primary;

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [Color(0xFF0B1220), Color(0xFF111B32), Color(0xFF121C35)],
              ),
            ),
          ),
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: const Alignment(-0.8, -0.8),
                  radius: 1.6,
                  colors: [accent.withOpacity(0.18), Colors.transparent],
                ),
              ),
            ),
          ),
          Align(
            alignment: Alignment.topRight,
            child: Padding(
              padding: const EdgeInsets.only(top: 40, right: 40),
              child: Container(
                width: 160,
                height: 160,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: accent.withOpacity(0.12),
                  boxShadow: [
                    BoxShadow(
                      color: accent.withOpacity(0.16),
                      blurRadius: 40,
                      spreadRadius: 0,
                    ),
                  ],
                ),
              ),
            ),
          ),
          Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 36),
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 520),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(36),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 28, sigmaY: 28),
                    child: Container(
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.10),
                        borderRadius: BorderRadius.circular(36),
                        border: Border.all(color: Colors.white.withOpacity(0.12)),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 36),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Text(
                            'DRRMO SECURE ACCESS',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.92),
                              fontSize: 26,
                              letterSpacing: 1.2,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'INFRASTRUCTURE ACCESS CONFIGURATION',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.65),
                              fontSize: 13,
                              letterSpacing: 1.4,
                              height: 1.6,
                            ),
                          ),
                          const SizedBox(height: 28),
                          Text(
                            'Sign in to access your responder command dashboard and dispatch controls.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.7),
                              fontSize: 14,
                              height: 1.6,
                            ),
                          ),
                          const SizedBox(height: 30),
                          Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.06),
                              borderRadius: BorderRadius.circular(28),
                              border: Border.all(color: Colors.white.withOpacity(0.10)),
                            ),
                            child: Column(
                              children: [
                                TextFormField(
                                  controller: _email,
                                  keyboardType: TextInputType.emailAddress,
                                  style: const TextStyle(color: Colors.white),
                                  decoration: InputDecoration(
                                    labelText: 'Email',
                                    labelStyle: TextStyle(color: Colors.white.withOpacity(0.72)),
                                    floatingLabelBehavior: FloatingLabelBehavior.auto,
                                    filled: true,
                                    fillColor: Colors.white.withOpacity(0.05),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(22),
                                      borderSide: BorderSide(color: Colors.white.withOpacity(0.12)),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(22),
                                      borderSide: BorderSide(color: Colors.white.withOpacity(0.12)),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(22),
                                      borderSide: BorderSide(color: accent),
                                    ),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                                  ),
                                ),
                                const SizedBox(height: 18),
                                TextFormField(
                                  controller: _password,
                                  obscureText: !_showPassword,
                                  style: const TextStyle(color: Colors.white),
                                  decoration: InputDecoration(
                                    labelText: 'Password',
                                    labelStyle: TextStyle(color: Colors.white.withOpacity(0.72)),
                                    floatingLabelBehavior: FloatingLabelBehavior.auto,
                                    filled: true,
                                    fillColor: Colors.white.withOpacity(0.05),
                                    border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(22),
                                      borderSide: BorderSide(color: Colors.white.withOpacity(0.12)),
                                    ),
                                    enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(22),
                                      borderSide: BorderSide(color: Colors.white.withOpacity(0.12)),
                                    ),
                                    focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(22),
                                      borderSide: BorderSide(color: accent),
                                    ),
                                    contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                                    suffixIcon: IconButton(
                                      onPressed: () => setState(() => _showPassword = !_showPassword),
                                      icon: Icon(
                                        _showPassword ? Icons.visibility_off : Icons.visibility,
                                        color: Colors.white70,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(height: 24),
                          FilledButton(
                            onPressed: auth.isLoading ? null : _submit,
                            style: FilledButton.styleFrom(
                              backgroundColor: accent,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
                              padding: const EdgeInsets.symmetric(vertical: 18),
                              elevation: 0,
                            ),
                            child: Text(auth.isLoading ? 'Signing in...' : 'Sign in'),
                          ),
                          const SizedBox(height: 22),
                          Container(
                            padding: const EdgeInsets.all(18),
                            decoration: BoxDecoration(
                              color: Colors.white.withOpacity(0.05),
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(color: Colors.white.withOpacity(0.10)),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.stretch,
                              children: [
                                const Text(
                                  'DEMO CREDENTIALS',
                                  style: TextStyle(
                                    color: Colors.white70,
                                    fontSize: 11,
                                    letterSpacing: 1.6,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 10),
                                Text('Email: ${LoginScreen.demoEmail}', style: const TextStyle(color: Colors.white70, fontSize: 13)),
                                Text('Password: ${LoginScreen.demoPassword}', style: const TextStyle(color: Colors.white70, fontSize: 13)),
                                const SizedBox(height: 12),
                                TextButton(
                                  onPressed: () {
                                    _email.text = LoginScreen.demoEmail;
                                    _password.text = LoginScreen.demoPassword;
                                  },
                                  child: const Text('Fill demo credentials'),
                                ),
                              ],
                            ),
                          ),
                          if (auth.errorMessage != null) ...[
                            const SizedBox(height: 18),
                            Text(auth.errorMessage!, textAlign: TextAlign.center, style: const TextStyle(color: Color(0xFFFAB73D), fontSize: 13)),
                          ],
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
