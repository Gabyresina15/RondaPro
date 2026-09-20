import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/l10n/app_strings.dart';
import '../../rondas/data/ronda_repository.dart';
import '../../rondas/presentation/ronda_detail_screen.dart';
import 'notifications_controller.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
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
      await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => RondaDetailScreen(ronda: ronda)),
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
    return Scaffold(
      appBar: AppBar(title: Text(s.notifications)),
      body: controller.loading && controller.items.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : controller.items.isEmpty
              ? Center(child: Text(s.noNotifications))
              : ListView.separated(
                  itemCount: controller.items.length,
                  separatorBuilder: (_, __) => const Divider(height: 1),
                  itemBuilder: (context, index) {
                    final item = controller.items[index];
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
    );
  }
}
