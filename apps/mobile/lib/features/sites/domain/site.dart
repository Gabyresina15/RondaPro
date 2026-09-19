class Site {
  const Site({
    required this.id,
    required this.name,
    required this.address,
    required this.notes,
    required this.ownerId,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String name;
  final String address;
  final String notes;
  final String ownerId;
  final DateTime createdAt;
  final DateTime updatedAt;

  factory Site.fromJson(Map<String, dynamic> json) {
    return Site(
      id: json['id'] as String,
      name: json['name'] as String,
      address: (json['address'] as String?) ?? '',
      notes: (json['notes'] as String?) ?? '',
      ownerId: json['ownerId'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}
