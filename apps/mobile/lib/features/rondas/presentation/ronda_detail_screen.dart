import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/theme/app_theme.dart';
import '../data/ronda_repository.dart';
import '../domain/ronda.dart';
import 'display_format.dart';
import 'rondas_controller.dart';
import 'share_ronda_pdf.dart';

class RondaDetailScreen extends StatefulWidget {
  const RondaDetailScreen({
    super.key,
    required this.ronda,
    this.generateSummary = false,
  });

  final Ronda ronda;
  final bool generateSummary;

  @override
  State<RondaDetailScreen> createState() => _RondaDetailScreenState();
}

class _RondaDetailScreenState extends State<RondaDetailScreen> {
  late Ronda _ronda;
  bool _generating = false;

  @override
  void initState() {
    super.initState();
    _ronda = widget.ronda;
    if (widget.generateSummary) {
      _generating = true;
      WidgetsBinding.instance.addPostFrameCallback((_) => _runComplete());
    }
  }

  Future<void> _runComplete() async {
    final completed = await context.read<RondasController>().complete();
    if (!mounted) return;
    setState(() {
      _generating = false;
      if (completed != null) {
        _ronda = completed;
      }
    });
    if (completed == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.read<RondasController>().error ??
                'No se pudo completar la ronda',
          ),
        ),
      );
    }
  }

  Future<void> _editFinding(RondaFinding finding) async {
    final assignee = TextEditingController(text: finding.assignee ?? '');
    final note = TextEditingController(text: finding.resolutionNote ?? '');
    final close = finding.isOpen;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(close ? 'Cerrar hallazgo' : 'Reabrir hallazgo'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(finding.title),
                const SizedBox(height: 12),
                TextField(
                  controller: assignee,
                  decoration: const InputDecoration(labelText: 'Asignado'),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: note,
                  decoration: const InputDecoration(labelText: 'Nota de resolución'),
                  minLines: 2,
                  maxLines: 4,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancelar'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: Text(close ? 'Cerrar' : 'Reabrir'),
            ),
          ],
        );
      },
    );
    if (confirmed != true || !mounted) {
      return;
    }
    final updated = await context.read<RondasController>().updateFinding(
          rondaId: _ronda.id,
          findingId: finding.id,
          status: close ? 'closed' : 'open',
          assignee: assignee.text.trim(),
          resolutionNote: note.text.trim(),
        );
    if (updated != null && mounted) {
      setState(() => _ronda = updated);
    }
  }

  Future<void> _exportPdf() async {
    try {
      final bytes = await context.read<RondaRepository>().exportPdf(_ronda.id);
      await shareRondaPdf(
        bytes: bytes,
        rondaId: _ronda.id,
        text: _ronda.templateName,
      );
      if (!mounted) return;
      final shortId = _ronda.id.length > 6
          ? _ronda.id.substring(_ronda.id.length - 6)
          : _ronda.id;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('PDF descargado · rondapro-$shortId.pdf')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo exportar el PDF: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final ronda = _ronda;
    final score = scoreOf(ronda);
    final parsed = parseSummary(ronda);
    return Scaffold(
      appBar: AppBar(
        title: Text(ronda.templateName),
        actions: [
          IconButton(
            tooltip: 'Exportar PDF',
            onPressed: _exportPdf,
            icon: const Icon(Icons.picture_as_pdf_outlined),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _ScoreHeader(ronda: ronda, score: score),
          const SizedBox(height: 16),
          if (_generating) ...[
            const _SummarySkeletonCard(),
            const SizedBox(height: 16),
          ] else if ((ronda.summary ?? '').isNotEmpty) ...[
            _AiSummaryCard(ronda: ronda, parsed: parsed),
            const SizedBox(height: 16),
          ],
          if (ronda.findings.isNotEmpty) ...[
            Text('Hallazgos', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            ...ronda.findings.map(
              (f) => Card(
                child: ListTile(
                  title: Text(f.title),
                  subtitle: Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Wrap(
                          spacing: 6,
                          runSpacing: 6,
                          children: [
                            _ToneChip(
                              label: formatSeverity(f.severity),
                              color: severityColor(f.severity),
                            ),
                            _ToneChip(
                              label: formatFindingStatus(f.status),
                              color: f.isOpen
                                  ? const Color(0xFFB54708)
                                  : const Color(0xFF027A48),
                            ),
                          ],
                        ),
                        if ((f.assignee ?? '').isNotEmpty)
                          Text('Asignado: ${f.assignee}'),
                        if (f.notes.isNotEmpty) Text(f.notes),
                        if ((f.resolutionNote ?? '').isNotEmpty)
                          Text('Resolución: ${f.resolutionNote}'),
                      ],
                    ),
                  ),
                  trailing: TextButton(
                    onPressed: () => _editFinding(f),
                    child: Text(f.isOpen ? 'Cerrar' : 'Reabrir'),
                  ),
                  onTap: () => _editFinding(f),
                ),
              ),
            ),
            const SizedBox(height: 8),
          ],
          Text('Respuestas', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          ...ronda.answers.map(
            (answer) => ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(answer.label),
              subtitle: Text(_answerText(answer)),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Fotos (${ronda.photos.length})',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: ronda.photos
                .map((photo) => _RemotePhoto(rondaId: ronda.id, photo: photo))
                .toList(),
          ),
        ],
      ),
    );
  }

  String _answerText(RondaAnswer answer) {
    if (answer.type == 'bool') {
      if (answer.naValue) return 'N/A';
      if (answer.boolValue == true) return 'Pasa';
      if (answer.boolValue == false) return 'No pasa';
      return 'Sin responder';
    }
    if (answer.type == 'text') {
      return (answer.textValue ?? '').isEmpty ? 'Sin notas' : answer.textValue!;
    }
    return 'Ítem de foto';
  }
}

class _ScoreHeader extends StatelessWidget {
  const _ScoreHeader({required this.ronda, required this.score});
  final Ronda ronda;
  final RondaScore score;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            SizedBox(
              width: 64,
              height: 64,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  CircularProgressIndicator(
                    value: score.total == 0 ? 0 : score.ok / score.total,
                    strokeWidth: 7,
                    color: AppTheme.ink,
                    backgroundColor: const Color(0x221B2423),
                  ),
                  Text('${score.percent}%',
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    [
                      '${score.ok}/${score.applicable} OK',
                      '${score.percent}% cumplimiento',
                      if (score.na > 0) '${score.na} N/A',
                    ].join(' · '),
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    [
                      ronda.isCompleted ? 'Completada' : 'En curso',
                      if ((ronda.siteName ?? '').isNotEmpty) ronda.siteName!,
                      if (ronda.location.isNotEmpty) ronda.location,
                    ].join(' · '),
                  ),
                  if (ronda.completedAt != null)
                    Text('Finalizada ${formatDateTimeEs(ronda.completedAt!)}'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AiSummaryCard extends StatelessWidget {
  const _AiSummaryCard({required this.ronda, required this.parsed});
  final Ronda ronda;
  final ParsedSummary parsed;

  @override
  Widget build(BuildContext context) {
    final risk = formatRisk(parsed.risk);
    final color = riskColor(parsed.risk);
    final model = (ronda.summaryModel ?? '').trim();
    final unavailable = model == 'gemini-unavailable';
    final showModel = ronda.summarySource == 'llm' &&
        model.isNotEmpty &&
        model.toLowerCase() != 'heuristic' &&
        !unavailable;
    final bits = <String>[
      if (ronda.summarySource == 'llm') 'Gemini' else 'Heurístico',
      if (unavailable) 'Gemini no disponible',
      if (showModel) model,
      if (ronda.summarySource == 'llm' &&
          ronda.summaryLatencyMs != null &&
          ronda.summaryLatencyMs! > 0)
        '${ronda.summaryLatencyMs} ms',
    ];
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    risk,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.6,
                    ),
                  ),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0x140B3D3A),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    bits.join(' · '),
                    style: Theme.of(context).textTheme.labelSmall,
                  ),
                ),
              ],
            ),
            if (parsed.executive.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text(parsed.executive),
            ],
            if (parsed.keyFindings.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text('Hallazgos clave', style: Theme.of(context).textTheme.titleSmall),
              ...parsed.keyFindings.map(
                (item) => Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('•  '),
                      Expanded(child: Text(item)),
                    ],
                  ),
                ),
              ),
            ],
            if (parsed.actions.isNotEmpty) ...[
              const SizedBox(height: 12),
              Text('Acciones', style: Theme.of(context).textTheme.titleSmall),
              ...parsed.actions.asMap().entries.map(
                    (e) => Padding(
                      padding: const EdgeInsets.only(top: 6),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          CircleAvatar(
                            radius: 10,
                            backgroundColor: AppTheme.ink,
                            foregroundColor: Colors.white,
                            child: Text(
                              '${e.key + 1}',
                              style: const TextStyle(fontSize: 11),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(child: Text(e.value)),
                        ],
                      ),
                    ),
                  ),
            ],
          ],
        ),
      ),
    );
  }
}

class _ToneChip extends StatelessWidget {
  const _ToneChip({required this.label, required this.color});
  final String label;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.35)),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontWeight: FontWeight.w700, fontSize: 12),
      ),
    );
  }
}

class _RemotePhoto extends StatelessWidget {
  const _RemotePhoto({required this.rondaId, required this.photo});

  final String rondaId;
  final RondaPhoto photo;

  @override
  Widget build(BuildContext context) {
    final repo = context.read<RondaRepository>();
    return FutureBuilder<List<int>>(
      future: repo.photoBytes(rondaId, photo.id),
      builder: (context, snapshot) {
        if (!snapshot.hasData) {
          return Container(
            width: 96,
            height: 96,
            alignment: Alignment.center,
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
            child: snapshot.hasError
                ? const Icon(Icons.broken_image_outlined)
                : const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
          );
        }
        final bytes = Uint8List.fromList(snapshot.data ?? const []);
        return Image.memory(
          bytes,
          width: 96,
          height: 96,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => Container(
            width: 96,
            height: 96,
            alignment: Alignment.center,
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
            child: const Icon(Icons.broken_image_outlined),
          ),
        );
      },
    );
  }
}

class _SummarySkeletonCard extends StatelessWidget {
  const _SummarySkeletonCard();

  @override
  Widget build(BuildContext context) {
    Widget bar({required double width, required double height}) {
      return Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: const Color(0x221B2423),
          borderRadius: BorderRadius.circular(8),
        ),
      );
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: const Color(0x221B2423),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    '…',
                    style: TextStyle(
                      fontWeight: FontWeight.w800,
                      letterSpacing: 0.6,
                    ),
                  ),
                ),
                const Spacer(),
                const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
                const SizedBox(width: 8),
                Text(
                  'Gemini está armando el resumen',
                  style: Theme.of(context).textTheme.labelSmall,
                ),
              ],
            ),
            const SizedBox(height: 16),
            bar(width: double.infinity, height: 12),
            const SizedBox(height: 8),
            bar(width: 240, height: 12),
            const SizedBox(height: 8),
            bar(width: 180, height: 12),
            const SizedBox(height: 16),
            bar(width: 120, height: 10),
            const SizedBox(height: 8),
            bar(width: double.infinity, height: 10),
            const SizedBox(height: 6),
            bar(width: 200, height: 10),
          ],
        ),
      ),
    );
  }
}
