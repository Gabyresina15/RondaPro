import 'package:flutter/foundation.dart';

import '../data/notification_repository.dart';
import '../domain/app_notification.dart';

class NotificationsController extends ChangeNotifier {
  NotificationsController(this._repository);

  final NotificationRepository _repository;

  List<AppNotification> _items = const [];
  bool _loading = false;

  List<AppNotification> get items => _items;
  bool get loading => _loading;
  int get unreadCount => _items.where((n) => n.isUnread).length;

  Future<void> load() async {
    _loading = true;
    notifyListeners();
    try {
      _items = await _repository.list();
    } catch (_) {
      _items = const [];
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> markRead(String id) async {
    try {
      final updated = await _repository.markRead(id);
      _items = _items.map((n) => n.id == id ? updated : n).toList();
      notifyListeners();
    } catch (_) {}
  }
}
