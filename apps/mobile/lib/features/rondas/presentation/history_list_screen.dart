import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'perform_ronda_screen.dart';
import 'ronda_detail_screen.dart';
import 'rondas_controller.dart';

class HistoryListScreen extends StatefulWidget {
  const HistoryListScreen({super.key});

  @override
  State<HistoryListScreen> createState() => _HistoryListScreenState();
}

class _HistoryListScreenState extends State<HistoryListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RondasController>().loadHistory();
    });
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<RondasController>();

    if (controller.loading && controller.items.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (controller.error != null && controller.items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(controller.error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: controller.loadHistory,
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }
    if (controller.items.isEmpty) {
      return const Center(
        child: Text('No rondas yet.\nStart one from a template.'),
      );
    }

    return RefreshIndicator(
      onRefresh: controller.loadHistory,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 24),
        itemCount: controller.items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, index) {
          final item = controller.items[index];
          return Card(
            child: ListTile(
              leading: Icon(
                item.isCompleted ? Icons.check_circle : Icons.timelapse,
              ),
              title: Text(item.templateName),
              subtitle: Text(
                [
                  item.siteName ??
                      (item.location.isEmpty ? 'No location' : item.location),
                  item.isCompleted ? 'Completed' : 'In progress',
                  '${item.photos.length} photos',
                  '${item.findings.where((f) => f.isOpen).length} open findings',
                ].join(' · '),
              ),
              onTap: () {
                if (item.isCompleted) {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => RondaDetailScreen(ronda: item),
                    ),
                  );
                  return;
                }
                context.read<RondasController>().setCurrent(item);
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => PerformRondaScreen(ronda: item),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }
}
