import 'package:flutter/foundation.dart';

import '../data/auth_repository.dart';
import '../domain/auth_session.dart';
import '../domain/user.dart';

class AuthController extends ChangeNotifier {
  AuthController(this._repository);

  final AuthRepository _repository;

  AuthSession? _session;
  bool _busy = false;
  String? _error;

  AuthSession? get session => _session;
  User? get user => _session?.user;
  bool get isAuthenticated => _session != null;
  bool get busy => _busy;
  String? get error => _error;

  Future<bool> login(String email, String password) async {
    _busy = true;
    _error = null;
    notifyListeners();
    try {
      _session = await _repository.login(email: email, password: password);
      _busy = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _busy = false;
      notifyListeners();
      return false;
    }
  }

  Future<bool> register(String name, String email, String password) async {
    _busy = true;
    _error = null;
    notifyListeners();
    try {
      _session = await _repository.register(
        email: email,
        password: password,
        name: name,
      );
      _busy = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _busy = false;
      notifyListeners();
      return false;
    }
  }

  void logout() {
    _repository.logout();
    _session = null;
    _error = null;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
