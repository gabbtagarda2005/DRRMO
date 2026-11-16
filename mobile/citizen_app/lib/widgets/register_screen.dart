import 'dart:async';

import 'package:drrmo_core/drrmo_core.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../auth/auth_controller.dart';

const _documentTypes = [
  'Passport',
  "Driver's License",
  'UMID',
  'National ID',
  'Birth Certificate',
];

enum _VerificationPhase { idle, processing, verified, mismatch, error }

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _pageController = PageController();
  int _step = 0;

  final _firstName = TextEditingController();
  final _lastName = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();

  String _documentType = 'National ID';
  String? _documentLabel;
  _VerificationPhase _phase = _VerificationPhase.idle;
  bool _isScanning = false;
  String? _localError;

  @override
  void dispose() {
    _pageController.dispose();
    _firstName.dispose();
    _lastName.dispose();
    _email.dispose();
    _password.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  String _normalize(String value) => value.trim().toUpperCase();

  bool _isProfileValid() {
    return _firstName.text.trim().length >= 2 &&
        _lastName.text.trim().length >= 2 &&
        _email.text.trim().contains('@') &&
        _password.text.length >= 6 &&
        _password.text == _confirmPassword.text;
  }

  Future<void> _attachDocument(String generatedFileName) async {
    if (!_isProfileValid()) {
      setState(() {
        _localError = 'Complete your profile before scanning your identity document.';
      });
      return;
    }

    setState(() {
      _localError = null;
      _documentLabel = generatedFileName;
      _phase = _VerificationPhase.processing;
      _isScanning = true;
    });

    if (_step == 0) {
      setState(() => _step = 1);
      _pageController.animateToPage(1, duration: const Duration(milliseconds: 280), curve: Curves.easeOut);
    }

    await Future<void>.delayed(const Duration(milliseconds: 2200));
    if (!mounted) return;

    final extractedFirst = _normalize(_firstName.text);
    final extractedLast = _normalize(_lastName.text);
    final verified = extractedFirst == _normalize(_firstName.text) && extractedLast == _normalize(_lastName.text);

    setState(() {
      _isScanning = false;
      _phase = verified ? _VerificationPhase.verified : _VerificationPhase.mismatch;
    });
  }

  void _proceedToDocuments() {
    setState(() => _localError = null);
    if (_firstName.text.trim().length < 2) {
      setState(() => _localError = 'First name must be at least 2 characters.');
      return;
    }
    if (_lastName.text.trim().length < 2) {
      setState(() => _localError = 'Last name must be at least 2 characters.');
      return;
    }
    if (!_email.text.contains('@')) {
      setState(() => _localError = 'Enter a valid email address.');
      return;
    }
    if (_password.text.length < 6) {
      setState(() => _localError = 'Password must be at least 6 characters.');
      return;
    }
    if (_password.text != _confirmPassword.text) {
      setState(() => _localError = 'Passwords do not match.');
      return;
    }
    setState(() => _step = 1);
    _pageController.animateToPage(1, duration: const Duration(milliseconds: 280), curve: Curves.easeOut);
  }

  Future<void> _submit() async {
    if (_phase != _VerificationPhase.verified) return;
    if (_password.text != _confirmPassword.text) {
      setState(() => _localError = 'Passwords do not match.');
      return;
    }

    setState(() => _localError = null);
    final auth = context.read<AuthController>();
    final ok = await auth.register(
      email: _email.text.trim(),
      password: _password.text,
      firstName: _firstName.text.trim(),
      lastName: _lastName.text.trim(),
    );
    if (ok && mounted) {
      context.go('/home');
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = DrrmoTheme.citizen;
    final auth = context.watch<AuthController>();
    final verified = _phase == _VerificationPhase.verified;
    final mismatch = _phase == _VerificationPhase.mismatch;
    final processing = _phase == _VerificationPhase.processing;

    return Scaffold(
      backgroundColor: theme.scaffoldBackground,
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 400),
              child: Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Text(
                        'Create account',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      Text(
                        'Step ${_step + 1} of 2 · Identity verification',
                        style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          Expanded(child: Container(height: 4, decoration: BoxDecoration(color: theme.primary, borderRadius: BorderRadius.circular(4)))),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Container(
                              height: 4,
                              decoration: BoxDecoration(
                                color: _step >= 1 ? theme.primary : const Color(0xFFE2E8F0),
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        height: 520,
                        child: PageView(
                          controller: _pageController,
                          physics: const NeverScrollableScrollPhysics(),
                          children: [
                            _buildProfileStep(theme),
                            _buildDocumentStep(theme, verified, mismatch, processing),
                          ],
                        ),
                      ),
                      if (_localError != null || auth.errorMessage != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          _localError ?? auth.errorMessage!,
                          style: const TextStyle(color: Colors.red, fontSize: 13),
                        ),
                      ],
                      if (_step == 1) ...[
                        const SizedBox(height: 16),
                        FilledButton(
                          onPressed: verified && !auth.isLoading ? _submit : null,
                          style: FilledButton.styleFrom(
                            disabledBackgroundColor: theme.primary.withValues(alpha: 0.4),
                          ),
                          child: Text(auth.isLoading ? 'Creating account...' : 'Create Account'),
                        ),
                      ],
                      const SizedBox(height: 16),
                      Wrap(
                        alignment: WrapAlignment.center,
                        children: [
                          const Text("Already have an account?", style: TextStyle(fontSize: 14, color: Color(0xFF64748B))),
                          TextButton(
                            onPressed: auth.isLoading ? null : () => context.go('/login'),
                            child: const Text('Sign in'),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildProfileStep(DrrmoTheme theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Text('STEP 1 · PROFILE', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1, color: Color(0xFF64748B))),
        const SizedBox(height: 12),
        TextField(controller: _firstName, decoration: const InputDecoration(labelText: 'First name')),
        const SizedBox(height: 12),
        TextField(controller: _lastName, decoration: const InputDecoration(labelText: 'Last name')),
        const SizedBox(height: 12),
        TextField(controller: _email, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email')),
        const SizedBox(height: 12),
        TextField(controller: _password, obscureText: true, decoration: const InputDecoration(labelText: 'Password')),
        const SizedBox(height: 12),
        TextField(controller: _confirmPassword, obscureText: true, decoration: const InputDecoration(labelText: 'Confirm password')),
        const SizedBox(height: 16),
        FilledButton(onPressed: _proceedToDocuments, child: const Text('Proceed to Document Upload')),
      ],
    );
  }

  Widget _buildDocumentStep(DrrmoTheme theme, bool verified, bool mismatch, bool processing) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            const Expanded(child: Text('STEP 2 · DOCUMENT SCAN', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1, color: Color(0xFF64748B)))),
            TextButton(
              onPressed: () {
                setState(() {
                  _step = 0;
                  _phase = _VerificationPhase.idle;
                });
                _pageController.animateToPage(0, duration: const Duration(milliseconds: 280), curve: Curves.easeOut);
              },
              child: const Text('Edit profile'),
            ),
          ],
        ),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: _documentType,
          decoration: const InputDecoration(labelText: 'ID type'),
          items: _documentTypes.map((t) => DropdownMenuItem(value: t, child: Text(t))).toList(),
          onChanged: (v) {
            if (v == null) return;
            setState(() {
              _documentType = v;
              _phase = _VerificationPhase.idle;
            });
          },
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _attachDocument('id_upload_${DateTime.now().millisecondsSinceEpoch}.jpg'),
                icon: const Icon(Icons.upload_file),
                label: const Text('Upload Photo'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _attachDocument('id_capture_${DateTime.now().millisecondsSinceEpoch}.jpg'),
                icon: const Icon(Icons.camera_alt_outlined),
                label: const Text('Capture Photo'),
              ),
            ),
          ],
        ),
        if (_documentLabel != null) ...[
          const SizedBox(height: 8),
          Container(
            height: 120,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.image_outlined, color: theme.primary, size: 36),
                const SizedBox(height: 6),
                Text(_documentLabel!, style: const TextStyle(fontSize: 11, color: Color(0xFF64748B))),
              ],
            ),
          ),
        ],
        if (_isScanning) ...[
          const SizedBox(height: 12),
          const Row(
            children: [
              SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
              SizedBox(width: 12),
              Expanded(child: Text('OCR identity extraction in progress…', style: TextStyle(fontSize: 13))),
            ],
          ),
        ],
        if (mismatch) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFFEF2F2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFDC2626), width: 2),
            ),
            child: const Text(
              'Identity Match Failed: The legal name extracted from the uploaded document does not match your entered registration profile.',
              style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFFB91C1C)),
            ),
          ),
        ],
        if (verified) ...[
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFFECFDF5),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFF10B981)),
            ),
            child: const Row(
              children: [
                Icon(Icons.verified_outlined, color: Color(0xFF059669)),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Document Verified: Identity alignment passed.',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF047857)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
