import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import 'models.dart';

const String _apiUrlFromEnv = String.fromEnvironment('DRRMO_API_URL');

String get apiBaseUrl {
  if (_apiUrlFromEnv.isNotEmpty) {
    return _apiUrlFromEnv;
  }

  if (kIsWeb) {
    return 'http://localhost:5000';
  }

  switch (defaultTargetPlatform) {
    case TargetPlatform.android:
      return 'http://10.0.2.2:5000';
    default:
      return 'http://localhost:5000';
  }
}

class AuthRepository {
  static const _tokenKey = 'drrmo_token';
  static const _userKey = 'drrmo_user';

  User? _currentUser;
  String? _token;

  User? get currentUser => _currentUser;
  String? get authToken => _token;

  Future<void> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final storedToken = prefs.getString(_tokenKey);
    final storedUser = prefs.getString(_userKey);

    if (storedToken == null || storedUser == null) {
      _currentUser = null;
      _token = null;
      return;
    }

    try {
      final userJson = jsonDecode(storedUser) as Map<String, dynamic>;
      _token = storedToken;
      _currentUser = User.fromJson(userJson);
    } catch (_) {
      _currentUser = null;
      _token = null;
      await logout();
    }
  }

  Future<User> login({
    required String email,
    required String password,
    required String expectedRole,
  }) async {
    final uri = Uri.parse('$apiBaseUrl/api/auth/login');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode != 200) {
      throw _parseApiException(response, fallback: 'Login failed.');
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    final token = body['token'] as String?;
    final userJson = body['user'] as Map<String, dynamic>?;

    if (token == null || userJson == null) {
      throw const ApiException('Invalid login response from the server.');
    }

    final user = User.fromJson(userJson);
    if (user.role != expectedRole) {
      throw ApiException('Account role does not match the selected app.');
    }

    await _saveSession(token, user);
    return user;
  }

  Future<User> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String role,
  }) async {
    final uri = Uri.parse('$apiBaseUrl/api/auth/register');
    final response = await http.post(
      uri,
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        'role': role,
      }),
    );

    if (response.statusCode != 201) {
      throw _parseApiException(response, fallback: 'Registration failed.');
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    final token = body['token'] as String?;
    final userJson = body['user'] as Map<String, dynamic>?;

    if (token == null || userJson == null) {
      throw const ApiException('Invalid registration response from the server.');
    }

    final user = User.fromJson(userJson);
    await _saveSession(token, user);
    return user;
  }

  Future<void> logout() async {
    _token = null;
    _currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userKey);
  }

  Future<void> _saveSession(String token, User user) async {
    _token = token;
    _currentUser = user;

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userKey, jsonEncode(user.toJson()));
  }
}

class AppSyncRepository {
  static const _knownFeatureIdsKey = 'drrmo_known_feature_ids';
  static const _cachedManifestKey = 'drrmo_cached_feature_manifest';

  Future<FeatureManifest> fetchCitizenFeatures() async {
    final uri = Uri.parse('$apiBaseUrl/api/app/citizen/features');
    final response = await http.get(uri, headers: {'Accept': 'application/json'});

    if (response.statusCode != 200) {
      throw _parseApiException(response, fallback: 'Could not fetch feature manifest.');
    }

    final body = jsonDecode(response.body) as Map<String, dynamic>;
    final manifest = FeatureManifest.fromJson(body);
    await saveCachedManifest(manifest);
    return manifest;
  }

  Future<Set<String>> loadKnownFeatureIds() async {
    final prefs = await SharedPreferences.getInstance();
    final items = prefs.getStringList(_knownFeatureIdsKey);
    if (items == null) return <String>{};
    return items.toSet();
  }

  Future<void> saveKnownFeatureIds(Set<String> ids) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_knownFeatureIdsKey, ids.toList());
  }

  Future<FeatureManifest> restoreCachedManifest() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonString = prefs.getString(_cachedManifestKey);
    if (jsonString == null) {
      return FeatureManifest.defaults();
    }

    try {
      final raw = jsonDecode(jsonString) as Map<String, dynamic>;
      return FeatureManifest.fromJson(raw);
    } catch (_) {
      return FeatureManifest.defaults();
    }
  }

  Future<void> saveCachedManifest(FeatureManifest manifest) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_cachedManifestKey, jsonEncode(manifest.toJson()));
  }
}

ApiException _parseApiException(http.Response response, {required String fallback}) {
  try {
    final body = jsonDecode(response.body);
    if (body is Map<String, dynamic>) {
      final message = body['message'] as String?;
      if (message != null && message.isNotEmpty) {
        return ApiException(message);
      }
    }
  } catch (_) {
    // ignore
  }

  if (response.statusCode == 401) {
    return const ApiException('Authentication failed.');
  }

  return ApiException('$fallback (${response.statusCode})');
}
