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
  bool get loading => _loading;
  String? get error => _error;

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
  }) async {
    try {
      final created = await _repository.create(
        name: name,
        address: address,
        notes: notes,
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
