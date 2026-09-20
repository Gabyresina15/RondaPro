class AppNotification {
  const AppNotification({
    required this.id,
    required this.title,
    required this.body,
    this.rondaId,
    this.readAt,
    required this.createdAt,
  });

  final String id;
  final String title;
  final String body;
  final String? rondaId;
  final DateTime? readAt;
  final DateTime createdAt;

  bool get isUnread => readAt == null;

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      title: json['title'] as String,
      body: json['body'] as String,
      rondaId: json['rondaId'] as String?,
      readAt: json['readAt'] == null
          ? null
          : DateTime.parse(json['readAt'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
