class RondaAnswer {
  const RondaAnswer({
    required this.itemIndex,
    required this.label,
    required this.type,
    this.textValue,
    this.boolValue,
    this.naValue = false,
  });

  final int itemIndex;
  final String label;
  final String type;
  final String? textValue;
  final bool? boolValue;
  final bool naValue;

  factory RondaAnswer.fromJson(Map<String, dynamic> json) {
    return RondaAnswer(
      itemIndex: json['itemIndex'] as int,
      label: json['label'] as String,
      type: json['type'] as String,
      textValue: json['textValue'] as String?,
      boolValue: json['boolValue'] as bool?,
      naValue: json['naValue'] == true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'itemIndex': itemIndex,
      'label': label,
      'type': type,
      if (textValue != null) 'textValue': textValue,
      if (boolValue != null) 'boolValue': boolValue,
      if (naValue) 'naValue': true,
    };
  }

  RondaAnswer copyWith({
    String? textValue,
    bool? boolValue,
    bool? naValue,
    bool clearBool = false,
  }) {
    return RondaAnswer(
      itemIndex: itemIndex,
      label: label,
      type: type,
      textValue: textValue ?? this.textValue,
      boolValue: clearBool ? null : (boolValue ?? this.boolValue),
      naValue: naValue ?? this.naValue,
    );
  }
}

class RondaPhoto {
  const RondaPhoto({
    required this.id,
    required this.filename,
    required this.mimeType,
    required this.url,
    this.itemIndex,
    required this.createdAt,
  });

  final String id;
  final String filename;
  final String mimeType;
  final String url;
  final int? itemIndex;
  final DateTime createdAt;

  factory RondaPhoto.fromJson(Map<String, dynamic> json) {
    return RondaPhoto(
      id: json['id'] as String,
      filename: json['filename'] as String,
      mimeType: json['mimeType'] as String,
      url: json['url'] as String,
      itemIndex: json['itemIndex'] as int?,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class RondaFinding {
  const RondaFinding({
    required this.id,
    required this.title,
    required this.notes,
    required this.severity,
    required this.status,
    this.itemIndex,
    this.assignee,
    this.resolutionNote,
    this.resolvedAt,
    required this.createdAt,
  });

  final String id;
  final String title;
  final String notes;
  final String severity;
  final String status;
  final int? itemIndex;
  final String? assignee;
  final String? resolutionNote;
  final DateTime? resolvedAt;
  final DateTime createdAt;

  bool get isOpen => status == 'open';

  factory RondaFinding.fromJson(Map<String, dynamic> json) {
    final resolvedAt = json['resolvedAt'];
    return RondaFinding(
      id: json['id'] as String,
      title: json['title'] as String,
      notes: (json['notes'] as String?) ?? '',
      severity: json['severity'] as String? ?? 'medium',
      status: json['status'] as String? ?? 'open',
      itemIndex: json['itemIndex'] is int ? json['itemIndex'] as int : null,
      assignee: json['assignee'] as String?,
      resolutionNote: json['resolutionNote'] as String?,
      resolvedAt: resolvedAt is String && resolvedAt.isNotEmpty
          ? DateTime.tryParse(resolvedAt)
          : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class Ronda {
  const Ronda({
    required this.id,
    required this.templateId,
    required this.templateName,
    required this.ownerId,
    this.siteId,
    this.siteName,
    required this.location,
    required this.status,
    required this.answers,
    required this.photos,
    this.findings = const [],
    this.summary,
    this.summarySource,
    this.summaryModel,
    this.summaryLatencyMs,
    this.summaryRisk,
    this.summaryKeyFindings = const [],
    this.summaryActions = const [],
    this.completedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String templateId;
  final String templateName;
  final String ownerId;
  final String? siteId;
  final String? siteName;
  final String location;
  final String status;
  final List<RondaAnswer> answers;
  final List<RondaPhoto> photos;
  final List<RondaFinding> findings;
  final String? summary;
  final String? summarySource;
  final String? summaryModel;
  final int? summaryLatencyMs;
  final String? summaryRisk;
  final List<String> summaryKeyFindings;
  final List<String> summaryActions;
  final DateTime? completedAt;
  final DateTime createdAt;
  final DateTime updatedAt;

  bool get isCompleted => status == 'completed';

  factory Ronda.fromJson(Map<String, dynamic> json) {
    return Ronda(
      id: json['id'] as String,
      templateId: json['templateId'] as String,
      templateName: json['templateName'] as String,
      ownerId: json['ownerId'] as String,
      siteId: json['siteId'] as String?,
      siteName: json['siteName'] as String?,
      location: (json['location'] as String?) ?? '',
      status: json['status'] as String,
      answers: (json['answers'] as List<dynamic>? ?? const [])
          .map((e) => RondaAnswer.fromJson(e as Map<String, dynamic>))
          .toList(),
      photos: (json['photos'] as List<dynamic>? ?? const [])
          .map((e) => RondaPhoto.fromJson(e as Map<String, dynamic>))
          .toList(),
      findings: (json['findings'] as List<dynamic>? ?? const [])
          .map((e) => RondaFinding.fromJson(e as Map<String, dynamic>))
          .toList(),
      summary: json['summary'] as String?,
      summarySource: json['summarySource'] as String?,
      summaryModel: json['summaryModel'] as String?,
      summaryLatencyMs: json['summaryLatencyMs'] is int
          ? json['summaryLatencyMs'] as int
          : int.tryParse('${json['summaryLatencyMs'] ?? ''}'),
      summaryRisk: json['summaryRisk'] as String?,
      summaryKeyFindings: (json['summaryKeyFindings'] as List<dynamic>? ?? const [])
          .map((e) => e.toString())
          .toList(),
      summaryActions: (json['summaryActions'] as List<dynamic>? ?? const [])
          .map((e) => e.toString())
          .toList(),
      completedAt: json['completedAt'] == null
          ? null
          : DateTime.parse(json['completedAt'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}
