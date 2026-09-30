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
  String get address => es ? 'Direcci\u00f3n' : 'Address';
  String get notes => es ? 'Notas' : 'Notes';
  String get noLocation => es ? 'Sin ubicaci\u00f3n' : 'No location';
  String get findings => es ? 'Hallazgos' : 'Findings';
  String get answers => es ? 'Respuestas' : 'Answers';
  String get photos => es ? 'Fotos' : 'Photos';
  String get llmSummary => es ? 'Resumen IA' : 'LLM summary';
  String summaryCaption({
    required String? source,
    String? model,
    int? latencyMs,
  }) {
    final isLlm = source == 'llm';
    if (!isLlm) {
      return es
          ? 'Resumen autom\u00e1tico \u00b7 heur\u00edstico'
          : 'Automatic summary \u00b7 heuristic';
    }
    final provider = (model ?? '').toLowerCase().contains('gpt')
        ? 'OpenAI'
        : 'Gemini';
    final bits = <String>[
      es ? 'Resumen IA' : 'LLM summary',
      provider,
      if ((model ?? '').isNotEmpty) model!,
      if (latencyMs != null && latencyMs > 0) '${latencyMs}ms',
    ];
    return bits.join(' \u00b7 ');
  }
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
  String get signIn => es ? 'Entrar' : 'Sign in';
  String get register => es ? 'Registrarse' : 'Register';
  String get email => 'Email';
  String get password => es ? 'Contrase\u00f1a' : 'Password';
  String get emailRequired =>
      es ? 'El email es obligatorio' : 'Email is required';
  String get emailInvalid =>
      es ? 'Ingres\u00e1 un email v\u00e1lido' : 'Enter a valid email';
  String get passwordRequired =>
      es ? 'La contrase\u00f1a es obligatoria' : 'Password is required';
  String get passwordMin =>
      es ? 'Us\u00e1 al menos 8 caracteres' : 'Use at least 8 characters';
  String get nameRequired =>
      es ? 'El nombre es obligatorio' : 'Name is required';
  String get newTemplate => es ? 'Nueva plantilla' : 'New template';
  String get start => es ? 'Empezar' : 'Start';
  String get extraLocation =>
      es ? 'Nota de ubicaci\u00f3n' : 'Extra location note';
  String get noTemplates => es
      ? 'Todav\u00eda no hay plantillas.\nCre\u00e1 una para tu equipo.'
      : 'No templates yet.\nCreate one for your team.';
  String get addFinding => es ? 'Agregar hallazgo' : 'Add finding';
  String get addDemoPhotos => es ? 'Adjuntar fotos' : 'Attach photos';
  String get attachPhotosHint => es
      ? 'Adjunta 2 evidencias para poder completar'
      : 'Attach 2 evidence photos to complete';
  String get completeRonda => es ? 'Completar ronda' : 'Complete ronda';
  String get attachPhoto => es ? 'Adjuntar foto' : 'Attach photo';
  String get attachExtraPhoto =>
      es ? 'Adjuntar foto extra' : 'Attach extra photo';
  String get pendingFail => es ? 'Pendiente / falla' : 'Pending / fail';
  String photosMin(int n) =>
      es ? '$n/2 fotos m\u00ednimo' : '$n/2 photos minimum';
  String photosForItem(int n) =>
      es ? 'Fotos de este \u00edtem: $n' : 'Photos for this item: $n';
  String get dashboard => 'Dashboard';
  String get sites => es ? 'Sitios' : 'Sites';
  String get openFindings =>
      es ? 'Hallazgos abiertos' : 'Open findings';
  String get noOpenFindings =>
      es ? 'No hay hallazgos abiertos.' : 'No open findings.';
  String get highSeverity => es ? 'Gravedad alta' : 'High severity';
  String get exportPdf => es ? 'Exportar PDF' : 'Export PDF';
  String get finished => es ? 'Finalizada' : 'Finished';
  String get generatedByLlm => es ? 'Generado por IA' : 'Generated by LLM';
  String get generatedHeuristic => es
      ? 'Resumen autom\u00e1tico \u00b7 heur\u00edstico'
      : 'Automatic summary \u00b7 heuristic';
  String summaryCaptionLlm({String? model, int? latencyMs}) {
    final bits = <String>['Resumen IA', 'Gemini'];
    if ((model ?? '').isNotEmpty) bits.add(model!);
    if (latencyMs != null) bits.add('${latencyMs}ms');
    return bits.join(' \u00b7 ');
  }
  String get summaryCaptionHeuristic => es
      ? 'Resumen autom\u00e1tico \u00b7 heur\u00edstico'
      : 'Automatic summary \u00b7 heuristic';
  String get refresh => es ? 'Actualizar' : 'Refresh';
  String get haveAccount =>
      es ? '\u00bfYa ten\u00e9s cuenta? Entrar' : 'Already have an account? Sign in';
  String get needAccount =>
      es ? '\u00bfNo ten\u00e9s cuenta? Registrarse' : 'Need an account? Register';

  String roleLabel(String role) {
    if (role == 'supervisor') return 'Supervisor';
    return 'Auditor';
  }

  String photosCount(int n) => es ? '$n fotos' : '$n photos';
  String openFindingsCount(int n) =>
      es ? '$n hallazgos abiertos' : '$n open findings';
}
