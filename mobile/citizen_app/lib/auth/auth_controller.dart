import 'package:drrmo_core/drrmo_core.dart';
import 'package:flutter/foundation.dart';

class AuthController extends ChangeNotifier {
  AuthController({AuthRepository? repository})
      : _repository = repository ?? AuthRepository();

  final AuthRepository _repository;

  User? get user => _repository.currentUser;
  bool get isAuthenticated => user != null;
  bool isLoading = true;
  String? errorMessage;

  Future<void> bootstrap() async {
    isLoading = true;
    notifyListeners();
    try {
      await _repository.restoreSession();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  /// Re-validates the stored session without showing the full-app loading gate.
  Future<void> refreshSession() async {
    if (!isAuthenticated) return;
    try {
      await _repository.restoreSession();
    } finally {
      notifyListeners();
    }
  }

  void clearError() {
    errorMessage = null;
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    errorMessage = null;
    isLoading = true;
    notifyListeners();
    try {
      await _repository.login(
        email: email,
        password: password,
        expectedRole: UserRoles.citizen,
      );
      return true;
    } on ApiException catch (e) {
      errorMessage = e.message;
      return false;
    } catch (_) {
      errorMessage = 'Login failed. Check your credentials and try again.';
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
  }) async {
    errorMessage = null;
    isLoading = true;
    notifyListeners();
    try {
      await _repository.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        role: UserRoles.citizen,
      );
      return true;
    } on ApiException catch (e) {
      errorMessage = e.message;
      return false;
    } catch (_) {
      errorMessage = 'Registration failed. Please try again.';
      return false;
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    notifyListeners();
  }
}
