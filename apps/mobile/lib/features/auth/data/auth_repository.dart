import '../../../core/network/api_client.dart';
import '../domain/auth_session.dart';
import '../domain/user.dart';

class AuthRepository {
  AuthRepository(this._api);

  final ApiClient _api;

  Future<AuthSession> login({
    required String email,
    required String password,
  }) async {
    final json = await _api.postJson('/auth/login', {
      'email': email,
      'password': password,
    });
    final session = _sessionFromJson(json);
    _api.setToken(session.token);
    return session;
  }

  Future<AuthSession> register({
    required String email,
    required String password,
    required String name,
  }) async {
    final json = await _api.postJson('/auth/register', {
      'email': email,
      'password': password,
      'name': name,
    });
    final session = _sessionFromJson(json);
    _api.setToken(session.token);
    return session;
  }

  void logout() {
    _api.setToken(null);
  }

  AuthSession _sessionFromJson(Map<String, dynamic> json) {
    return AuthSession(
      user: User.fromJson(json['user'] as Map<String, dynamic>),
      token: json['token'] as String,
    );
  }
}
