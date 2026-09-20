import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

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

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<NotificationsController>();
    return Scaffold(
      appBar: AppBar(title: const Text('Notificaciones')),
      body: controller.loading && controller.items.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : controller.items.isEmpty
              ? const Center(child: Text('No hay notificaciones'))
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
                      onTap: () => controller.markRead(item.id),
                    );
                  },
                ),
    );
  }
}
