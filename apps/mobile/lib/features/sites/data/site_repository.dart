import '../../../core/network/api_client.dart';
import '../domain/site.dart';

class SiteRepository {
  SiteRepository(this._api);

  final ApiClient _api;

  Future<List<Site>> list() async {
    final json = await _api.getJson('/sites', auth: true);
    final items = json['items'] as List<dynamic>? ?? const [];
    return items.map((e) => Site.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<Site> create({
    required String name,
    required String address,
    required String notes,
    String? parentId,
  }) async {
    final json = await _api.postJson(
      '/sites',
      {
        'name': name,
        'address': address,
        'notes': notes,
        if (parentId != null && parentId.isNotEmpty) 'parentId': parentId,
      },
      auth: true,
    );
    return Site.fromJson(json);
  }
}
