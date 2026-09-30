import 'package:flutter/material.dart';

import '../domain/ronda.dart';

String formatSeverity(String raw) {
  switch (raw.toLowerCase()) {
    case 'high':
    case 'alta':
    case 'alto':
      return 'Alta';
    case 'medium':
    case 'media':
    case 'medio':
      return 'Media';
    case 'low':
    case 'baja':
    case 'bajo':
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
    case 'resolved':
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

String formatRisk(String? raw) {
  switch ((raw ?? '').toLowerCase()) {
    case 'alto':
    case 'high':
      return 'ALTO';
    case 'medio':
    case 'medium':
      return 'MEDIO';
    case 'bajo':
    case 'low':
      return 'BAJO';
    default:
      return 'N/D';
  }
}

Color riskColor(String? raw) {
  switch ((raw ?? '').toLowerCase()) {
    case 'alto':
    case 'high':
      return const Color(0xFFB42318);
    case 'medio':
    case 'medium':
      return const Color(0xFFB54708);
    case 'bajo':
    case 'low':
      return const Color(0xFF027A48);
    default:
      return const Color(0xFF475467);
  }
}

Color severityColor(String raw) {
  switch (raw.toLowerCase()) {
    case 'high':
    case 'alta':
    case 'alto':
      return const Color(0xFFB42318);
    case 'medium':
    case 'media':
    case 'medio':
      return const Color(0xFFB54708);
    default:
      return const Color(0xFF475467);
  }
}

class RondaScore {
  const RondaScore({required this.ok, required this.total});
  final int ok;
  final int total;
  int get percent => total == 0 ? 0 : ((ok / total) * 100).round();
}

RondaScore scoreOf(Ronda ronda) {
  var ok = 0;
  var total = 0;
  for (final answer in ronda.answers) {
    total += 1;
    if (answer.type == 'bool' && answer.boolValue == true) ok += 1;
    if (answer.type == 'text' && (answer.textValue ?? '').trim().isNotEmpty) {
      ok += 1;
    }
    if (answer.type == 'photo' &&
        ronda.photos.any((p) => p.itemIndex == answer.itemIndex)) {
      ok += 1;
    }
  }
  return RondaScore(ok: ok, total: total);
}

class ParsedSummary {
  const ParsedSummary({
    required this.executive,
    required this.risk,
    required this.keyFindings,
    required this.actions,
  });

  final String executive;
  final String risk;
  final List<String> keyFindings;
  final List<String> actions;
}

ParsedSummary parseSummary(Ronda ronda) {
  final text = (ronda.summary ?? '').trim();
  var risk = ronda.summaryRisk ?? '';
  var findings = List<String>.from(ronda.summaryKeyFindings);
  var actions = List<String>.from(ronda.summaryActions);
  var executive = text;

  if (text.isNotEmpty) {
    final riskMatch = RegExp(
      r'Nivel de riesgo:\s*(Alto|Medio|Bajo|Desconocido)',
      caseSensitive: false,
    ).firstMatch(text);
    if (risk.isEmpty && riskMatch != null) {
      risk = riskMatch.group(1) ?? '';
    }

    String section(String header) {
      final start = text.indexOf(header);
      if (start < 0) return '';
      final rest = text.substring(start + header.length);
      final next = RegExp(r'\n\n[A-ZÁÉÍÓÚ]').firstMatch(rest);
      return (next == null ? rest : rest.substring(0, next.start)).trim();
    }

    if (findings.isEmpty) {
      findings = section('Hallazgos clave:')
          .split('\n')
          .map((l) => l.replaceFirst(RegExp(r'^[-•]\s*'), '').trim())
          .where((l) => l.isNotEmpty)
          .toList();
    }
    if (actions.isEmpty) {
      actions = section('Acciones recomendadas:')
          .split('\n')
          .map((l) => l.replaceFirst(RegExp(r'^\d+\.\s*'), '').trim())
          .where((l) => l.isNotEmpty)
          .toList();
    }
    final cut = text.indexOf('Nivel de riesgo:');
    if (cut > 0) executive = text.substring(0, cut).trim();
  }

  return ParsedSummary(
    executive: executive,
    risk: risk,
    keyFindings: findings,
    actions: actions,
  );
}
