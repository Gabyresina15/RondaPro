import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/l10n/app_strings.dart';
import '../../rondas/data/ronda_repository.dart';
import '../../rondas/presentation/perform_ronda_screen.dart';
import '../../rondas/presentation/ronda_detail_screen.dart';
import '../../rondas/presentation/rondas_controller.dart';
import 'notifications_controller.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _onlyPending = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<NotificationsController>().load();
    });
  }

  Future<void> _open(String? rondaId, String notificationId) async {
    await context.read<NotificationsController>().markRead(notificationId);
    if (rondaId == null || !mounted) return;
    try {
      final ronda = await context.read<RondaRepository>().getById(rondaId);
      if (!mounted) return;
      if (ronda.isCompleted) {
        await Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => RondaDetailScreen(ronda: ronda)),
        );
        return;
      }
      context.read<RondasController>().setCurrent(ronda);
      await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => PerformRondaScreen(ronda: ronda)),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.toString())),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<NotificationsController>();
    final s = S.of(context);
    final items = _onlyPending
        ? controller.items.where((n) => n.isUnread).toList()
        : controller.items;
    return Scaffold(
      appBar: AppBar(
        title: Text(s.notifications),
        actions: [
          if (controller.unreadCount > 0)
            TextButton(
              onPressed: controller.markAllRead,
              child: const Text('Leer todas'),
            ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
            child: SegmentedButton<bool>(
              segments: const [
                ButtonSegment(value: true, label: Text('Pendientes')),
                ButtonSegment(value: false, label: Text('Todas')),
              ],
              selected: {_onlyPending},
              onSelectionChanged: (value) {
                setState(() => _onlyPending = value.first);
              },
            ),
          ),
          Expanded(
            child: controller.loading && controller.items.isEmpty
                ? const Center(child: CircularProgressIndicator())
                : items.isEmpty
                    ? Center(
                        child: Text(
                          _onlyPending
                              ? 'No hay órdenes pendientes'
                              : s.noNotifications,
                        ),
                      )
                    : ListView.separated(
                        itemCount: items.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final item = items[index];
                          return ListTile(
                            leading: Icon(
                              item.isUnread
                                  ? Icons.notifications_active
                                  : Icons.notifications_none,
                            ),
                            title: Text(item.title),
                            subtitle: Text(item.body),
                            onTap: () => _open(item.rondaId, item.id),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
