import '../../../core/network/api_client.dart';
import '../domain/app_notification.dart';

class NotificationRepository {
  NotificationRepository(this._api);

  final ApiClient _api;

  Future<List<AppNotification>> list() async {
    final json = await _api.getJson('/notifications', auth: true);
    final items = json['items'] as List<dynamic>? ?? const [];
    return items
        .map((e) => AppNotification.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<AppNotification> markRead(String id) async {
    final json = await _api.patchJson('/notifications/$id/read', {}, auth: true);
    return AppNotification.fromJson(json);
  }
}
