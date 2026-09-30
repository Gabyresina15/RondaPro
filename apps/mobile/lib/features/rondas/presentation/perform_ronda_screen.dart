import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../../../core/config/app_config.dart';
import '../domain/ronda.dart';
import 'demo_photos.dart';
import 'display_format.dart';
import 'ronda_detail_screen.dart';
import 'rondas_controller.dart';

class PerformRondaScreen extends StatefulWidget {
  const PerformRondaScreen({super.key, required this.ronda});

  final Ronda ronda;

  @override
  State<PerformRondaScreen> createState() => _PerformRondaScreenState();
}

class _PerformRondaScreenState extends State<PerformRondaScreen> {
  late List<RondaAnswer> _answers;
  bool _busy = false;
  final _picker = ImagePicker();

  @override
  void initState() {
    super.initState();
    _answers = List<RondaAnswer>.from(widget.ronda.answers);
  }

  Ronda get _ronda =>
      context.watch<RondasController>().current ?? widget.ronda;

  Future<void> _persistAnswers() async {
    await context.read<RondasController>().saveAnswers(_answers);
  }

  Future<void> _pickPhoto({required int itemIndex}) async {
    final file = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 70,
      maxWidth: 1600,
    );
    if (file == null) {
      return;
    }
    final bytes = await file.readAsBytes();
    final mime = file.mimeType ??
        (file.name.toLowerCase().endsWith('.png')
            ? 'image/png'
            : 'image/jpeg');
    setState(() => _busy = true);
    final ok = await context.read<RondasController>().addPhotos([
      {
        'filename': file.name,
        'mimeType': mime == 'image/webp' ? 'image/jpeg' : mime,
        'dataBase64': base64Encode(bytes),
        'itemIndex': itemIndex,
      },
    ]);
    if (mounted) {
      setState(() => _busy = false);
      if (!ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              context.read<RondasController>().error ?? 'No se pudo subir la foto',
            ),
          ),
        );
      }
    }
  }

  Future<void> _addDemoPhotos() async {
    setState(() => _busy = true);
    final photoIndexes = _answers
        .where((a) => a.type == 'photo')
        .map((a) => a.itemIndex)
        .toList();
    final first = photoIndexes.isNotEmpty ? photoIndexes.first : 0;
    final second = photoIndexes.length > 1 ? photoIndexes[1] : first;
    final display = await loadDemoJpegBase64('display-promo');
    final ext = await loadDemoJpegBase64('extintor');
    final ok = await context.read<RondasController>().addPhotos([
      {
        'filename': 'display-promo.jpg',
        'mimeType': 'image/jpeg',
        'dataBase64': display,
        'itemIndex': first,
      },
      {
        'filename': 'extintor.jpg',
        'mimeType': 'image/jpeg',
        'dataBase64': ext,
        'itemIndex': second,
      },
    ]);
    if (mounted) {
      setState(() => _busy = false);
      if (!ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              context.read<RondasController>().error ?? 'No se pudieron agregar las fotos',
            ),
          ),
        );
      }
    }
  }

  Future<void> _addFinding() async {
    final title = TextEditingController();
    final notes = TextEditingController();
    var severity = 'medium';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setLocal) {
            return AlertDialog(
              title: const Text('Nuevo hallazgo'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  TextField(
                    controller: title,
                    decoration: const InputDecoration(labelText: 'T\u00edtulo'),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: notes,
                    decoration: const InputDecoration(labelText: 'Notas'),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: severity,
                    items: const [
                      DropdownMenuItem(value: 'low', child: Text('Baja')),
                      DropdownMenuItem(value: 'medium', child: Text('Media')),
                      DropdownMenuItem(value: 'high', child: Text('Alta')),
                    ],
                    onChanged: (value) =>
                        setLocal(() => severity = value ?? 'medium'),
                    decoration: const InputDecoration(labelText: 'Gravedad'),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.pop(context, false),
                  child: const Text('Cancelar'),
                ),
                FilledButton(
                  onPressed: () => Navigator.pop(context, true),
                  child: const Text('Guardar'),
                ),
              ],
            );
          },
        );
      },
    );
    if (confirmed != true || !mounted || title.text.trim().isEmpty) {
      return;
    }
    setState(() => _busy = true);
    final ok = await context.read<RondasController>().addFinding(
          title: title.text.trim(),
          notes: notes.text.trim(),
          severity: severity,
        );
    if (mounted) {
      setState(() => _busy = false);
      if (!ok) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              context.read<RondasController>().error ?? 'No se pudo agregar el hallazgo',
            ),
          ),
        );
      }
    }
  }

  Future<void> _complete() async {
    setState(() => _busy = true);
    await _persistAnswers();
    if (!mounted) {
      return;
    }
    final current =
        context.read<RondasController>().current ?? widget.ronda;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => RondaDetailScreen(
          ronda: current,
          generateSummary: true,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ronda = _ronda;
    final canComplete = !_busy;

    return Scaffold(
      appBar: AppBar(
        title: Text(ronda.templateName),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          Text(
            [
              if ((ronda.siteName ?? '').isNotEmpty) ronda.siteName!,
              if (ronda.location.isNotEmpty) ronda.location,
              if ((ronda.siteName ?? '').isEmpty && ronda.location.isEmpty)
                'Sin ubicaci\u00f3n',
            ].join(' \u00b7 '),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text('${ronda.photos.length} foto(s) \u00b7 opcionales'),
          const SizedBox(height: 16),
          ..._answers.map(_answerCard),
          const SizedBox(height: 8),
          if (ronda.findings.isNotEmpty) ...[
            Text('Hallazgos', style: Theme.of(context).textTheme.titleMedium),
            ...ronda.findings.map(
              (f) => ListTile(
                contentPadding: EdgeInsets.zero,
                leading: Icon(
                  f.isOpen ? Icons.report_outlined : Icons.check,
                ),
                title: Text(f.title),
                subtitle: Text(
                  '${formatSeverity(f.severity)} \u00b7 ${formatFindingStatus(f.status)}',
                ),
              ),
            ),
          ],
          OutlinedButton.icon(
            onPressed: _busy ? null : _addFinding,
            icon: const Icon(Icons.flag_outlined),
            label: const Text('Agregar hallazgo'),
          ),
          const SizedBox(height: 8),
          if (AppConfig.demoMode)
            OutlinedButton.icon(
              onPressed: _busy ? null : _addDemoPhotos,
              icon: const Icon(Icons.photo_library_outlined),
              label: const Text('Adjuntar fotos'),
            ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: canComplete ? _complete : null,
            child: _busy
                ? const SizedBox(
                    height: 22,
                    width: 22,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Completar ronda'),
          ),
        ],
      ),
    );
  }

  Widget _answerCard(RondaAnswer answer) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(answer.label, style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: 8),
            if (answer.type == 'bool')
              SegmentedButton<String>(
                emptySelectionAllowed: true,
                segments: const [
                  ButtonSegment(value: 'pass', label: Text('Pasa'), icon: Icon(Icons.check)),
                  ButtonSegment(value: 'fail', label: Text('Falla'), icon: Icon(Icons.close)),
                  ButtonSegment(value: 'na', label: Text('N/A')),
                ],
                selected: {
                  if (answer.naValue)
                    'na'
                  else if (answer.boolValue == true)
                    'pass'
                  else if (answer.boolValue == false)
                    'fail',
                },
                onSelectionChanged: _busy
                    ? null
                    : (value) {
                        final picked = value.isEmpty ? '' : value.first;
                        setState(() {
                          if (picked == 'na') {
                            _answers[answer.itemIndex] = answer.copyWith(
                              clearBool: true,
                              naValue: true,
                            );
                          } else if (picked == 'pass' || picked == 'fail') {
                            _answers[answer.itemIndex] = answer.copyWith(
                              boolValue: picked == 'pass',
                              naValue: false,
                            );
                          } else {
                            _answers[answer.itemIndex] = answer.copyWith(
                              clearBool: true,
                              naValue: false,
                            );
                          }
                        });
                        _persistAnswers();
                      },
              ),
            if (answer.type == 'text')
              TextFormField(
                initialValue: answer.textValue ?? '',
                enabled: !_busy,
                minLines: 2,
                maxLines: 4,
                decoration: const InputDecoration(hintText: 'Notas'),
                onChanged: (value) {
                  _answers[answer.itemIndex] =
                      answer.copyWith(textValue: value);
                },
                onFieldSubmitted: (_) => _persistAnswers(),
                onTapOutside: (_) => _persistAnswers(),
              ),
            if (answer.type == 'photo') ...[
              Text(
                'Fotos de este \u00edtem: ${_ronda.photos.where((p) => p.itemIndex == answer.itemIndex).length}',
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: _busy
                    ? null
                    : () => _pickPhoto(itemIndex: answer.itemIndex),
                icon: const Icon(Icons.add_a_photo_outlined),
                label: const Text('Sacar foto'),
              ),
            ],
            if (answer.type != 'photo') ...[
              const SizedBox(height: 8),
              TextButton.icon(
                onPressed: _busy
                    ? null
                    : () => _pickPhoto(itemIndex: answer.itemIndex),
                icon: const Icon(Icons.add_a_photo_outlined),
                label: const Text('Foto extra'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
