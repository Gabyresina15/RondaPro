import 'package:flutter/widgets.dart';

class S {
  S._(this.es);
  final bool es;

  factory S.of(BuildContext context) {
    final code = Localizations.localeOf(context).languageCode.toLowerCase();
    return S._(code.startsWith('es'));
  }

  String get templates => es ? 'Plantillas' : 'Templates';
  String get history => es ? 'Historial' : 'History';
  String get panel => 'Panel';
  String get signOut => es ? 'Salir' : 'Sign out';
  String get notifications => es ? 'Notificaciones' : 'Notifications';
  String get noNotifications =>
      es ? 'No hay notificaciones' : 'No notifications';
  String get assign => es ? 'Asignar' : 'Assign';
  String get assignRonda => es ? 'Asignar ronda' : 'Assign ronda';
  String get unassigned => es ? 'Sin asignar' : 'Unassigned';
  String assignedTo(String name) =>
      es ? 'Asignada a $name' : 'Assigned to $name';
  String get completed => es ? 'Completada' : 'Completed';
  String get inProgress => es ? 'En curso' : 'In progress';
  String get all => es ? 'Todas' : 'All';
  String get status => es ? 'Estado' : 'Status';
  String get site => es ? 'Sitio' : 'Site';
  String get allSites => es ? 'Todos los sitios' : 'All sites';
  String get openFindingsOnly =>
      es ? 'Solo hallazgos abiertos' : 'Only open findings';
  String get noRondas =>
      es ? 'No hay rondas con estos filtros.' : 'No rondas match these filters.';
  String get retry => es ? 'Reintentar' : 'Retry';
  String get cancel => es ? 'Cancelar' : 'Cancel';
  String get create => es ? 'Crear' : 'Create';
  String get newSite => es ? 'Nuevo sitio' : 'New site';
  String get name => es ? 'Nombre' : 'Name';
  String get address => es ? 'Dirección' : 'Address';
  String get notes => es ? 'Notas' : 'Notes';
  String get noLocation => es ? 'Sin ubicación' : 'No location';
  String get findings => es ? 'Hallazgos' : 'Findings';
  String get answers => es ? 'Respuestas' : 'Answers';
  String get photos => es ? 'Fotos' : 'Photos';
  String get llmSummary => es ? 'Resumen IA' : 'LLM summary';
  String get pass => es ? 'Pasa' : 'Pass';
  String get fail => es ? 'Falla' : 'Fail';
  String get notAnswered => es ? 'Sin responder' : 'Not answered';
  String get noNotes => es ? 'Sin notas' : 'No notes';
  String get close => es ? 'Cerrar' : 'Close';
  String get reopen => es ? 'Reabrir' : 'Reopen';
  String get loginSubtitle => es
      ? 'Entra para gestionar plantillas y rondas'
      : 'Sign in to manage checklist templates';
  String get registerSubtitle =>
      es ? 'Crea una cuenta de auditor' : 'Create an auditor account';

  String roleLabel(String role) {
    if (role == 'supervisor') return 'Supervisor';
    return 'Auditor';
  }

  String photosCount(int n) => es ? '$n fotos' : '$n photos';
  String openFindingsCount(int n) =>
      es ? '$n hallazgos abiertos' : '$n open findings';
}
