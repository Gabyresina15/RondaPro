enum ChecklistItemType { text, boolType, photo }

extension ChecklistItemTypeCodec on ChecklistItemType {
  String get apiValue {
    switch (this) {
      case ChecklistItemType.text:
        return 'text';
      case ChecklistItemType.boolType:
        return 'bool';
      case ChecklistItemType.photo:
        return 'photo';
    }
  }

  static ChecklistItemType fromApi(String value) {
    switch (value) {
      case 'text':
        return ChecklistItemType.text;
      case 'bool':
        return ChecklistItemType.boolType;
      case 'photo':
        return ChecklistItemType.photo;
      default:
        throw ArgumentError('Unknown checklist item type: $value');
    }
  }
}

class ChecklistItem {
  const ChecklistItem({
    required this.label,
    required this.required,
    required this.type,
  });

  final String label;
  final bool required;
  final ChecklistItemType type;

  factory ChecklistItem.fromJson(Map<String, dynamic> json) {
    return ChecklistItem(
      label: json['label'] as String,
      required: json['required'] as bool,
      type: ChecklistItemTypeCodec.fromApi(json['type'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'required': required,
      'type': type.apiValue,
    };
  }
}
