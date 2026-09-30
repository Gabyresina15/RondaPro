String formatSeverity(String raw) {
  switch (raw.toLowerCase()) {
    case 'high':
      return 'Alta';
    case 'medium':
      return 'Media';
    case 'low':
      return 'Baja';
    default:
      return raw;
  }
}

String formatFindingStatus(String raw) {
  switch (raw.toLowerCase()) {
    case 'open':
      return 'abierto';
    case 'closed':
      return 'cerrado';
    default:
      return raw;
  }
}

String formatDateTimeEs(DateTime dt) {
  final local = dt.toLocal();
  String two(int n) => n.toString().padLeft(2, '0');
  return '${two(local.day)}/${two(local.month)}/${local.year} '
      '${two(local.hour)}:${two(local.minute)}';
}
