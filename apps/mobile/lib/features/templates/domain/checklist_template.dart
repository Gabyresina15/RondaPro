import 'checklist_item.dart';

class ChecklistTemplate {
  const ChecklistTemplate({
    required this.id,
    required this.name,
    required this.description,
    required this.items,
    required this.ownerId,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String name;
  final String description;
  final List<ChecklistItem> items;
  final String ownerId;
  final DateTime createdAt;
  final DateTime updatedAt;

  factory ChecklistTemplate.fromJson(Map<String, dynamic> json) {
    final rawItems = json['items'] as List<dynamic>? ?? const [];
    return ChecklistTemplate(
      id: json['id'] as String,
      name: json['name'] as String,
      description: (json['description'] as String?) ?? '',
      items: rawItems
          .map((e) => ChecklistItem.fromJson(e as Map<String, dynamic>))
          .toList(),
      ownerId: json['ownerId'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}
