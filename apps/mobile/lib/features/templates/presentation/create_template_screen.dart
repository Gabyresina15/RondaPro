import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../domain/checklist_item.dart';
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
  const CreateTemplateScreen({super.key});

  @override
  State<CreateTemplateScreen> createState() => _CreateTemplateScreenState();
}

class _CreateTemplateScreenState extends State<CreateTemplateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final List<_DraftItem> _items = [
    _DraftItem(
      label: 'Floor clear of hazards',
      required: true,
      type: ChecklistItemType.boolType,
    ),
  ];
  bool _saving = false;

  @override
  void dispose() {
    _nameController.dispose();
    _descriptionController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }
    setState(() => _saving = true);
    final controller = context.read<TemplatesController>();
    final ok = await controller.create(
      name: _nameController.text.trim(),
      description: _descriptionController.text.trim(),
      items: _items
          .map(
            (d) => ChecklistItem(
              label: d.label.trim(),
              required: d.required,
              type: d.type,
            ),
          )
          .where((i) => i.label.isNotEmpty)
          .toList(),
    );
    setState(() => _saving = false);
    if (!mounted) {
      return;
    }
    if (ok) {
      Navigator.of(context).pop(true);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(controller.error ?? 'Failed to create template')),
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
        title: const Text('New template'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Name'),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Name is required';
                }
                return null;
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _descriptionController,
              decoration: const InputDecoration(labelText: 'Description'),
              maxLines: 2,
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Text(
                  'Items',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const Spacer(),
                TextButton.icon(
                  onPressed: _addItem,
                  icon: const Icon(Icons.add),
                  label: const Text('Add item'),
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
                        decoration: const InputDecoration(labelText: 'Label'),
                        onChanged: (value) => draft.label = value,
                        validator: (value) {
                          if (value == null || value.trim().isEmpty) {
                            return 'Label is required';
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
                              decoration: const InputDecoration(labelText: 'Type'),
                              items: const [
                                DropdownMenuItem(
                                  value: ChecklistItemType.text,
                                  child: Text('text'),
                                ),
                                DropdownMenuItem(
                                  value: ChecklistItemType.boolType,
                                  child: Text('bool'),
                                ),
                                DropdownMenuItem(
                                  value: ChecklistItemType.photo,
                                  child: Text('photo'),
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
                              const Text('Required'),
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
                  : const Text('Create template'),
            ),
          ],
        ),
      ),
    );
  }
}
