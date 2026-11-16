class ApiException implements Exception {
  final String message;

  const ApiException(this.message);

  @override
  String toString() => 'ApiException: $message';
}

class User {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String role;

  const User({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.role,
  });

  String get fullName => '$firstName $lastName';

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      role: json['role'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'role': role,
    };
  }
}

class UserRoles {
  static const citizen = 'citizen';
  static const responder = 'responder';
}

class FeatureManifest {
  final int version;
  final Set<String> enabledIds;

  const FeatureManifest({
    required this.version,
    required this.enabledIds,
  });

  factory FeatureManifest.fromJson(Map<String, dynamic> json) {
    final features = (json['features'] as List<dynamic>?) ?? <dynamic>[];
    final enabledIds = <String>{};

    for (final feature in features) {
      if (feature is Map<String, dynamic>) {
        final enabled = feature['enabled'] as bool?;
        final id = feature['id'] as String?;
        if (enabled == true && id != null) {
          enabledIds.add(id);
        }
      }
    }

    return FeatureManifest(
      version: json['version'] as int? ?? 1,
      enabledIds: enabledIds,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'version': version,
      'features': enabledIds.map((id) => {'id': id, 'enabled': true}).toList(),
    };
  }

  static FeatureManifest defaults() {
    return const FeatureManifest(version: 1, enabledIds: <String>{});
  }
}
