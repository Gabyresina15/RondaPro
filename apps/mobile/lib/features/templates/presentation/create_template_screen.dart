import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../domain/checklist_item.dart';
import '../domain/checklist_template.dart';
import 'templates_controller.dart';

class _DraftItem {
  _DraftItem({
    required this.label,
    required this.required,
    required this.type,
  });

  String label;
  bool required;
  ChecklistItemType type;
}

class CreateTemplateScreen extends StatefulWidget {
  const CreateTemplateScreen({super.key, this.existing});

  final ChecklistTemplate? existing;

  @override
  State<CreateTemplateScreen> createState() => _CreateTemplateScreenState();
}

class _CreateTemplateScreenState extends State<CreateTemplateScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _descriptionController;
  late final List<_DraftItem> _items;
  bool _saving = false;

  bool get _editing => widget.existing != null;

  @override
  void initState() {
    super.initState();
    final existing = widget.existing;
    _nameController = TextEditingController(text: existing?.name ?? '');
    _descriptionController =
        TextEditingController(text: existing?.description ?? '');
    if (existing != null && existing.items.isNotEmpty) {
      _items = existing.items
          .map(
            (item) => _DraftItem(
              label: item.label,
              required: item.required,
              type: item.type,
            ),
          )
          .toList();
    } else {
      _items = [
        _DraftItem(
          label: 'Piso libre de riesgos',
          required: true,
          type: ChecklistItemType.boolType,
        ),
      ];
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  List<ChecklistItem> _payload() {
    return _items
        .map(
          (d) => ChecklistItem(
            label: d.label.trim(),
            required: d.required,
            type: d.type,
          ),
        )
        .where((i) => i.label.isNotEmpty)
        .toList();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() => _saving = true);
    final controller = context.read<TemplatesController>();
    final items = _payload();
    final ok = _editing
        ? await controller.update(
            id: widget.existing!.id,
            name: _nameController.text.trim(),
            description: _descriptionController.text.trim(),
            items: items,
          )
        : await controller.create(
            name: _nameController.text.trim(),
            description: _descriptionController.text.trim(),
            items: items,
          );
    setState(() => _saving = false);
    if (!mounted) {
      return;
    }
    if (ok) {
      Navigator.of(context).pop(true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            controller.error ??
                (_editing
                    ? 'No se pudo guardar la plantilla'
                    : 'No se pudo crear la plantilla'),
          ),
        ),
      );
    }
  }

  void _addItem() {
    setState(() {
      _items.add(
        _DraftItem(
          label: '',
          required: false,
          type: ChecklistItemType.text,
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_editing ? 'Editar plantilla' : 'Nueva plantilla'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Nombre'),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'El nombre es obligatorio';
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(labelText: 'Descripción'),
              maxLines: 2,
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Text('Items', style: Theme.of(context).textTheme.titleMedium),
                const Spacer(),
                TextButton.icon(
                  onPressed: _addItem,
                  icon: const Icon(Icons.add),
                  label: const Text('Agregar item'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ...List.generate(_items.length, (index) {
              final draft = _items[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    children: [
                      TextFormField(
                        initialValue: draft.label,
                        decoration: const InputDecoration(labelText: 'Etiqueta'),
                        onChanged: (value) => draft.label = value,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'La etiqueta es obligatoria';
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<ChecklistItemType>(
                              value: draft.type,
                              decoration: const InputDecoration(labelText: 'Tipo'),
                              items: const [
                                DropdownMenuItem(
                                  value: ChecklistItemType.text,
                                  child: Text('Texto'),
                                ),
                                DropdownMenuItem(
                                  value: ChecklistItemType.boolType,
                                  child: Text('Pasa/Falla'),
                                ),
                                DropdownMenuItem(
                                  value: ChecklistItemType.photo,
                                  child: Text('Foto'),
                                ),
                              ],
                              onChanged: (value) {
                                if (value == null) {
                                  return;
                                }
                                setState(() => draft.type = value);
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Column(
                            children: [
                              const Text('Obligatorio'),
                              Switch(
                                value: draft.required,
                                onChanged: (value) {
                                  setState(() => draft.required = value);
                                },
                              ),
                            ],
                          ),
                          IconButton(
                            onPressed: _items.length == 1
                                ? null
                                : () {
                                    setState(() => _items.removeAt(index));
                                  },
                            icon: const Icon(Icons.delete_outline),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(
                      height: 22,
                      width: 22,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(_editing ? 'Guardar cambios' : 'Crear plantilla'),
            ),
          ],
        ),
      ),
    );
  }
}
