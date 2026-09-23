import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';

import '../domain/ronda.dart';
import 'ronda_detail_screen.dart';
import 'rondas_controller.dart';

const _demoPngA =
    'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAeklEQVR4nO3PUQkAIBTAwJfEYOY0oCH8OITBAtxm7fN1wwUNaEEDWtCAFjSgBQ1oQQNa0IAWNKAFDWhBA1rQgBY0oAUNaEEDWtCAFjSgBQ1oQQNa0IAWNKAFDWhBA1rQgBY0oAUNaEEDWtCAFjSgBQ1oQQNa0IAWPHYBUmfBD31AguIAAAAASUVORK5CYII=';
const _demoPngB =
    'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAIAAAAlC+aJAAAAeklEQVR4nO3PUQkAIBTAwBfHOMY2liH8OITBAtxm7PV1wwUNaEEDWtCAFjSgBQ1oQQNa0IAWNKAFDWhBA1rQgBY0oAUNaEEDWtCAFjSgBQ1oQQNa0IAWNKAFDWhBA1rQgBY0oAUNaEEDWtCAFjSgBQ1oQQNa0IAWPHYBd/oBLbmWUAcAAAAASUVORK5CYII=';

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
    final ok = await context.read<RondasController>().addPhotos([
      {
        'filename': 'evidence-a.png',
        'mimeType': 'image/png',
        'dataBase64': _demoPngA,
        'itemIndex': first,
      },
      {
        'filename': 'evidence-b.png',
        'mimeType': 'image/png',
        'dataBase64': _demoPngB,
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
                    decoration: const InputDecoration(labelText: 'Título'),
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
    final completed = await context.read<RondasController>().complete();
    if (!mounted) {
      return;
    }
    setState(() => _busy = false);
    if (completed == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.read<RondasController>().error ?? 'No se pudo completar la ronda',
          ),
        ),
      );
      return;
    }
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => RondaDetailScreen(ronda: completed),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final ronda = _ronda;
    final canComplete = ronda.photos.length >= 2 && !_busy;

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
                'Sin ubicación',
            ].join(' · '),
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text('${ronda.photos.length}/2 fotos mínimo'),
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
                subtitle: Text('${f.severity} · ${f.status}'),
              ),
            ),
          ],
          OutlinedButton.icon(
            onPressed: _busy ? null : _addFinding,
            icon: const Icon(Icons.flag_outlined),
            label: const Text('Agregar hallazgo'),
          ),
          const SizedBox(height: 8),
          OutlinedButton.icon(
            onPressed: _busy ? null : _addDemoPhotos,
            icon: const Icon(Icons.photo_library_outlined),
            label: const Text('Agregar 2 fotos de demo'),
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
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: Text(answer.boolValue == true ? 'Pasa' : 'Pendiente / falla'),
                value: answer.boolValue ?? false,
                onChanged: _busy
                    ? null
                    : (value) {
                        setState(() {
                          _answers[answer.itemIndex] =
                              answer.copyWith(boolValue: value);
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
                'Fotos de este ítem: ${_ronda.photos.where((p) => p.itemIndex == answer.itemIndex).length}',
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
