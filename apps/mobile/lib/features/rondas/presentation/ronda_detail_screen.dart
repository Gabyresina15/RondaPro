import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../data/ronda_repository.dart';
import '../domain/ronda.dart';
import 'rondas_controller.dart';

class RondaDetailScreen extends StatefulWidget {
  const RondaDetailScreen({super.key, required this.ronda});

  final Ronda ronda;

  @override
  State<RondaDetailScreen> createState() => _RondaDetailScreenState();
}

class _RondaDetailScreenState extends State<RondaDetailScreen> {
  late Ronda _ronda;

  @override
  void initState() {
    super.initState();
    _ronda = widget.ronda;
  }

  String _summaryCaption(Ronda ronda) {
    final text = ronda.summary ?? '';
    if (text.contains('fallo de conexión') || text.contains('Revisión manual requerida')) {
      return 'Modelo no disponible · resumen de contingencia';
    }
    if (ronda.summarySource == 'llm') {
      return 'Generado por Gemini';
    }
    return 'Resumen automático';
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
      final dir = await getTemporaryDirectory();
      final file = File('${dir.path}/rondapro-${_ronda.id}.pdf');
      await file.writeAsBytes(bytes, flush: true);
      await Share.shareXFiles(
        [XFile(file.path, mimeType: 'application/pdf')],
        text: _ronda.templateName,
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
          Text(
            ronda.isCompleted ? 'Completada' : 'En curso',
            style: Theme.of(context).textTheme.labelLarge,
          ),
          const SizedBox(height: 4),
          Text(
            [
              if ((ronda.siteName ?? '').isNotEmpty) ronda.siteName!,
              if (ronda.location.isNotEmpty) ronda.location,
              if ((ronda.siteName ?? '').isEmpty && ronda.location.isEmpty)
                'Sin ubicación',
            ].join(' · '),
          ),
          if (ronda.completedAt != null) ...[
            const SizedBox(height: 4),
            Text('Finalizada ${ronda.completedAt!.toLocal()}'),
          ],
          const SizedBox(height: 16),
          if ((ronda.summary ?? '').isNotEmpty) ...[
            Text('Resumen', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 4),
            Text(
              _summaryCaption(ronda),
              style: Theme.of(context).textTheme.bodySmall,
            ),
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Text(ronda.summary ?? ''),
              ),
            ),
            const SizedBox(height: 16),
          ],
          if (ronda.findings.isNotEmpty) ...[
            Text('Hallazgos', style: Theme.of(context).textTheme.titleMedium),
            ...ronda.findings.map(
              (f) => Card(
                child: ListTile(
                  title: Text(f.title),
                  subtitle: Text(
                    [
                      '${f.severity} · ${f.isOpen ? 'abierto' : 'cerrado'}',
                      if ((f.assignee ?? '').isNotEmpty) 'Asignado: ${f.assignee}',
                      if (f.notes.isNotEmpty) f.notes,
                      if ((f.resolutionNote ?? '').isNotEmpty)
                        'Resolución: ${f.resolutionNote}',
                    ].join('\n'),
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
