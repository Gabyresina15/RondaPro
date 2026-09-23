import 'package:flutter/foundation.dart';

import '../data/site_repository.dart';
import '../domain/site.dart';

class SitesController extends ChangeNotifier {
  SitesController(this._repository);

  final SiteRepository _repository;

  List<Site> _items = const [];
  bool _loading = false;
  String? _error;

  List<Site> get items => _items;
  List<Site> get buildings =>
      _items.where((s) => s.parentId == null || s.parentId!.isEmpty).toList();
  bool get loading => _loading;
  String? get error => _error;

  Site? parentOf(Site site) {
    if (site.parentId == null) return null;
    try {
      return _items.firstWhere((s) => s.id == site.parentId);
    } catch (_) {
      return null;
    }
  }

  Future<void> load() async {
    _loading = true;
    _error = null;
    notifyListeners();
    try {
      _items = await _repository.list();
      _loading = false;
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      _loading = false;
      notifyListeners();
    }
  }

  Future<bool> create({
    required String name,
    required String address,
    required String notes,
    String? parentId,
  }) async {
    try {
      final created = await _repository.create(
        name: name,
        address: address,
        notes: notes,
        parentId: parentId,
      );
      _items = [created, ..._items];
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
}
