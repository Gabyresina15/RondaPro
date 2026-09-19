class RondaAnswer {
  const RondaAnswer({
    required this.itemIndex,
    required this.label,
    required this.type,
    this.textValue,
    this.boolValue,
  });

  final int itemIndex;
  final String label;
  final String type;
  final String? textValue;
  final bool? boolValue;

  factory RondaAnswer.fromJson(Map<String, dynamic> json) {
    return RondaAnswer(
      itemIndex: json['itemIndex'] as int,
      label: json['label'] as String,
      type: json['type'] as String,
      textValue: json['textValue'] as String?,
      boolValue: json['boolValue'] as bool?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'itemIndex': itemIndex,
      'label': label,
      'type': type,
      if (textValue != null) 'textValue': textValue,
      if (boolValue != null) 'boolValue': boolValue,
    };
  }

  RondaAnswer copyWith({String? textValue, bool? boolValue}) {
    return RondaAnswer(
      itemIndex: itemIndex,
      label: label,
      type: type,
      textValue: textValue ?? this.textValue,
      boolValue: boolValue ?? this.boolValue,
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

class Ronda {
  const Ronda({
    required this.id,
    required this.templateId,
    required this.templateName,
    required this.ownerId,
    required this.location,
    required this.status,
    required this.answers,
    required this.photos,
    this.summary,
    this.summarySource,
    this.completedAt,
    required this.createdAt,
    required this.updatedAt,
  });

  final String id;
  final String templateId;
  final String templateName;
  final String ownerId;
  final String location;
  final String status;
  final List<RondaAnswer> answers;
  final List<RondaPhoto> photos;
  final String? summary;
  final String? summarySource;
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
      location: (json['location'] as String?) ?? '',
      status: json['status'] as String,
      answers: (json['answers'] as List<dynamic>? ?? const [])
          .map((e) => RondaAnswer.fromJson(e as Map<String, dynamic>))
          .toList(),
      photos: (json['photos'] as List<dynamic>? ?? const [])
          .map((e) => RondaPhoto.fromJson(e as Map<String, dynamic>))
          .toList(),
      summary: json['summary'] as String?,
      summarySource: json['summarySource'] as String?,
      completedAt: json['completedAt'] == null
          ? null
          : DateTime.parse(json['completedAt'] as String),
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}
