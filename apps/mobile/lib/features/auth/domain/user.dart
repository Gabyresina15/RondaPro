class User {
  const User({
    required this.id,
    required this.email,
    required this.name,
    this.role = 'auditor',
  });

  final String id;
  final String email;
  final String name;
  final String role;

  bool get isSupervisor => role == 'supervisor';

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      name: json['name'] as String,
      role: (json['role'] as String?) ?? 'auditor',
    );
  }
}
