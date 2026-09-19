import 'package:flutter/foundation.dart';

import '../data/template_repository.dart';
import '../domain/checklist_item.dart';
import '../domain/checklist_template.dart';

class TemplatesController extends ChangeNotifier {
  TemplatesController(this._repository);

  final TemplateRepository _repository;

  List<ChecklistTemplate> _items = const [];
  bool _loading = false;
  String? _error;

  List<ChecklistTemplate> get items => _items;
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
    required String description,
    required List<ChecklistItem> items,
  }) async {
    _error = null;
    notifyListeners();
    try {
      final created = await _repository.create(
        name: name,
        description: description,
        items: items,
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
