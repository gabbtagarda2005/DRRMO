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

  Future<bool> login(String email, String password) async {
    errorMessage = null;
    isLoading = true;
    notifyListeners();
    try {
      await _repository.login(
        email: email,
        password: password,
        expectedRole: UserRoles.responder,
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

  Future<void> logout() async {
    await _repository.logout();
    notifyListeners();
  }
}
