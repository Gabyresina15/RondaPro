import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../auth/domain/user.dart';
import '../data/ronda_repository.dart';
import '../domain/ronda.dart';
import 'rondas_controller.dart';

Future<Ronda?> showAssignRondaSheet({
  required BuildContext context,
  required String rondaId,
}) async {
  final repo = context.read<RondaRepository>();
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
  final selected = await showModalBottomSheet<User>(
    context: context,
    builder: (context) {
      return SafeArea(
        child: ListView(
          shrinkWrap: true,
          children: [
            const ListTile(title: Text('Asignar ronda')),
            ...users.map(
              (u) => ListTile(
                leading: const Icon(Icons.person_outline),
                title: Text(u.name),
                subtitle: Text('${u.email} · ${u.role}'),
                onTap: () => Navigator.pop(context, u),
              ),
            ),
          ],
        ),
      );
    },
  );
  if (selected == null || !context.mounted) return null;
  final updated = await context.read<RondasController>().assign(
        rondaId,
        selected.id,
      );
  if (!context.mounted) return null;
  if (updated == null) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          context.read<RondasController>().error ?? 'No se pudo asignar',
        ),
      ),
    );
    return null;
  }
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text('Asignada a ${selected.name}')),
  );
  return updated;
}
