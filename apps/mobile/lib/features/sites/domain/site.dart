class Site {
  const Site({
    required this.id,
    required this.name,
    required this.address,
    required this.notes,
    required this.ownerId,
    this.parentId,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String name;
  final String address;
  final String notes;
  final String ownerId;
  final String? parentId;
  final DateTime createdAt;
  final DateTime updatedAt;

  bool get isStore => parentId != null && parentId!.isNotEmpty;

  factory Site.fromJson(Map<String, dynamic> json) {
    return Site(
      id: json['id'] as String,
      name: json['name'] as String,
      address: (json['address'] as String?) ?? '',
      notes: (json['notes'] as String?) ?? '',
      ownerId: json['ownerId'] as String,
      parentId: json['parentId'] as String?,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}
