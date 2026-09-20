import 'package:flutter/foundation.dart';

import '../data/ronda_repository.dart';
import '../domain/ronda.dart';

class RondasController extends ChangeNotifier {
  RondasController(this._repository);

  final RondaRepository _repository;

  List<Ronda> _items = const [];
  bool _loading = false;
  String? _error;
  Ronda? _current;

  List<Ronda> get items => _items;
  bool get loading => _loading;
  String? get error => _error;
  Ronda? get current => _current;

  Future<void> loadHistory() async {
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

  Future<Ronda?> start({
    required String templateId,
    required String location,
    String? siteId,
  }) async {
    _error = null;
    notifyListeners();
    try {
      _current = await _repository.start(
        templateId: templateId,
        location: location,
        siteId: siteId,
      );
      notifyListeners();
      return _current;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }

  Future<bool> saveAnswers(List<RondaAnswer> answers) async {
    final id = _current?.id;
    if (id == null) {
      return false;
    }
    try {
      _current = await _repository.saveAnswers(id, answers);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> addPhotos(List<Map<String, dynamic>> photos) async {
    final id = _current?.id;
    if (id == null) {
      return false;
    }
    try {
      _current = await _repository.addPhotos(id: id, photos: photos);
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<bool> addFinding({
    required String title,
    required String notes,
    required String severity,
  }) async {
    final id = _current?.id;
    if (id == null) {
      return false;
    }
    try {
      _current = await _repository.addFinding(
        id: id,
        title: title,
        notes: notes,
        severity: severity,
      );
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  Future<Ronda?> complete() async {
    final id = _current?.id;
    if (id == null) {
      return null;
    }
    try {
      _current = await _repository.complete(id);
      notifyListeners();
      return _current;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }

  void setCurrent(Ronda ronda) {
    _current = ronda;
    notifyListeners();
  }

  void _replace(Ronda ronda) {
    _current = ronda;
    _items = _items.map((item) => item.id == ronda.id ? ronda : item).toList();
    notifyListeners();
  }

  Future<Ronda?> updateFinding({
    required String rondaId,
    required String findingId,
    String? status,
    String? assignee,
    String? resolutionNote,
  }) async {
    try {
      final ronda = await _repository.updateFinding(
        id: rondaId,
        findingId: findingId,
        status: status,
        assignee: assignee,
        resolutionNote: resolutionNote,
      );
      _replace(ronda);
      return ronda;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }

  Future<Ronda?> assign(String rondaId, String assigneeId) async {
    try {
      final ronda = await _repository.assign(rondaId, assigneeId);
      _replace(ronda);
      return ronda;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }
}
