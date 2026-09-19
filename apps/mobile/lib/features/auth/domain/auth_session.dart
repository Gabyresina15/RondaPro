import 'user.dart';

class AuthSession {
  const AuthSession({
    required this.user,
    required this.token,
  });

  final User user;
  final String token;
}
