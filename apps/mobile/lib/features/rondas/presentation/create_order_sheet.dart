import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../auth/domain/user.dart';
import '../../sites/domain/site.dart';
import '../../sites/presentation/sites_controller.dart';
import '../data/ronda_repository.dart';
import '../domain/ronda.dart';
import 'rondas_controller.dart';

Future<Ronda?> showCreateOrderSheet({
  required BuildContext context,
  required String templateId,
}) async {
  final repo = context.read<RondaRepository>();
  final sites = context.read<SitesController>().items;
  List<User> users;
  try {
    users = await repo.listUsers();
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudieron cargar usuarios: $e')),
      );
    }
    return null;
  }
  if (!context.mounted) return null;

  Site? site = sites.isEmpty ? null : sites.first;
  User? auditor;
  for (final user in users) {
    if (user.role != 'supervisor') {
      auditor = user;
      break;
    }
  }
  auditor ??= users.isEmpty ? null : users.first;
  final note = TextEditingController();

  final confirmed = await showDialog<bool>(
    context: context,
    builder: (context) {
      return StatefulBuilder(
        builder: (context, setLocal) {
          return AlertDialog(
            title: const Text('Ordenar inspección'),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (sites.isNotEmpty)
                    DropdownButtonFormField<Site>(
                      value: site,
                      items: sites
                          .map(
                            (s) => DropdownMenuItem(
                              value: s,
                              child: Text(s.name),
                            ),
                          )
                          .toList(),
                      onChanged: (value) => setLocal(() => site = value),
                      decoration: const InputDecoration(labelText: 'Sitio'),
                    ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<User>(
                    value: auditor,
                    items: users
                        .map(
                          (u) => DropdownMenuItem(
                            value: u,
                            child: Text('${u.name} · ${u.role}'),
                          ),
                        )
                        .toList(),
                    onChanged: (value) => setLocal(() => auditor = value),
                    decoration: const InputDecoration(labelText: 'Auditor'),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: note,
                    decoration: const InputDecoration(
                      labelText: 'Nota de ubicación',
                    ),
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
                onPressed: auditor == null
                    ? null
                    : () => Navigator.pop(context, true),
                child: const Text('Enviar orden'),
              ),
            ],
          );
        },
      );
    },
  );
  if (confirmed != true || auditor == null || !context.mounted) {
    return null;
  }

  try {
    final created = await repo.createOrder(
      templateId: templateId,
      assigneeId: auditor!.id,
      location: note.text.trim(),
      siteId: site?.id,
    );
    if (context.mounted) {
      await context.read<RondasController>().loadHistory();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Orden enviada a ${auditor!.name}${site == null ? '' : ' · ${site!.name}'}',
          ),
        ),
      );
    }
    return created;
  } catch (e) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('No se pudo crear la orden: $e')),
      );
    }
    return null;
  }
}
