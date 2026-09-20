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
  String get loginSubtitle => es
      ? 'Entra para gestionar plantillas y rondas'
      : 'Sign in to manage checklist templates';
  String get registerSubtitle => es
      ? 'Crea una cuenta de auditor'
      : 'Create an auditor account';
  String roleLabel(String role) {
    if (role == 'supervisor') return 'Supervisor';
    return 'Auditor';
  }
}
