import '../../../core/network/api_client.dart';
import '../domain/checklist_item.dart';
import '../domain/checklist_template.dart';

class TemplateRepository {
  TemplateRepository(this._api);

  final ApiClient _api;

  Future<List<ChecklistTemplate>> list() async {
    final json = await _api.getJson('/templates', auth: true);
    final items = json['items'] as List<dynamic>? ?? const [];
    return items
        .map((e) => ChecklistTemplate.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<ChecklistTemplate> create({
    required String name,
    required String description,
    required List<ChecklistItem> items,
  }) async {
    final json = await _api.postJson(
      '/templates',
      {
        'name': name,
        'description': description,
        'items': items.map((i) => i.toJson()).toList(),
      },
      auth: true,
    );
    return ChecklistTemplate.fromJson(json);
  }

  Future<ChecklistTemplate> update({
    required String id,
    required String name,
    required String description,
    required List<ChecklistItem> items,
  }) async {
    final json = await _api.patchJson(
      '/templates/$id',
      {
        'name': name,
        'description': description,
        'items': items.map((i) => i.toJson()).toList(),
      },
      auth: true,
    );
    return ChecklistTemplate.fromJson(json);
  }
}
