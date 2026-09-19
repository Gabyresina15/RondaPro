import 'package:flutter/foundation.dart';

import '../data/dashboard_repository.dart';
import '../domain/dashboard_stats.dart';

class DashboardController extends ChangeNotifier {
  DashboardController(this._repository);

  final DashboardRepository _repository;

  DashboardStats? _stats;
  bool _loading = false;
  String? _error;

  DashboardStats? get stats => _stats;
  bool get loading => _loading;
  String? get error => _error;

  Future<void> load() async {
    _loading = _stats == null;
    _error = null;
    if (_loading) {
      notifyListeners();
    }
    try {
      final stats = await _repository.load();
      _stats = stats;
      _loading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
    }
  }
}
