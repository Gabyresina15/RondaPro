import 'dart:io';

import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';

import '../../auth/presentation/auth_controller.dart';
import '../../sites/presentation/sites_controller.dart';
import '../data/ronda_repository.dart';
import '../domain/ronda.dart';
import 'assign_ronda_sheet.dart';
import 'perform_ronda_screen.dart';
import 'ronda_detail_screen.dart';
import 'rondas_controller.dart';

class HistoryListScreen extends StatefulWidget {
  const HistoryListScreen({super.key});

  @override
  State<HistoryListScreen> createState() => _HistoryListScreenState();
}

class _HistoryListScreenState extends State<HistoryListScreen> {
  String _status = 'all';
  String? _siteId;
  bool _openFindingsOnly = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<RondasController>().loadHistory();
      context.read<SitesController>().load();
    });
  }

  List<Ronda> _filtered(List<Ronda> items) {
    return items.where((item) {
      if (_status != 'all' && item.status != _status) {
        return false;
      }
      if (_siteId != null && item.siteId != _siteId) {
        return false;
      }
      if (_openFindingsOnly && !item.findings.any((f) => f.isOpen)) {
        return false;
      }
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final controller = context.watch<RondasController>();
    final sites = context.watch<SitesController>().items;
    final items = _filtered(controller.items);
    final isSupervisor =
        context.watch<AuthController>().user?.isSupervisor ?? false;

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          child: Column(
            children: [
              DropdownButtonFormField<String>(
                value: _status,
                decoration: const InputDecoration(labelText: 'Status'),
                items: const [
                  DropdownMenuItem(value: 'all', child: Text('All')),
                  DropdownMenuItem(
                    value: 'in_progress',
                    child: Text('In progress'),
                  ),
                  DropdownMenuItem(
                    value: 'completed',
                    child: Text('Completed'),
                  ),
                ],
                onChanged: (value) => setState(() => _status = value ?? 'all'),
              ),
              const SizedBox(height: 8),
              DropdownButtonFormField<String?>(
                value: _siteId,
                decoration: const InputDecoration(labelText: 'Site'),
                items: [
                  const DropdownMenuItem<String?>(
                    value: null,
                    child: Text('All sites'),
                  ),
                  ...sites.map(
                    (site) => DropdownMenuItem<String?>(
                      value: site.id,
                      child: Text(site.name),
                    ),
                  ),
                ],
                onChanged: (value) => setState(() => _siteId = value),
              ),
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Only open findings'),
                value: _openFindingsOnly,
                onChanged: (value) =>
                    setState(() => _openFindingsOnly = value ?? false),
              ),
            ],
          ),
        ),
        Expanded(child: _list(controller, items, isSupervisor)),
      ],
    );
  }

  Widget _list(
    RondasController controller,
    List<Ronda> items,
    bool isSupervisor,
  ) {
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
              Text(controller.error ?? '', textAlign: TextAlign.center),
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
    if (items.isEmpty) {
      return const Center(child: Text('No rondas match these filters.'));
    }

    return RefreshIndicator(
      onRefresh: controller.loadHistory,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, index) {
          final item = items[index];
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
              trailing: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (isSupervisor)
                    IconButton(
                      tooltip: 'Asignar',
                      icon: const Icon(Icons.person_add_alt_1_outlined),
                      onPressed: () => showAssignRondaSheet(
                        context: context,
                        rondaId: item.id,
                      ),
                    ),
                  if (item.isCompleted)
                    IconButton(
                      tooltip: 'Export PDF',
                      icon: const Icon(Icons.picture_as_pdf_outlined),
                      onPressed: () async {
                        try {
                          final bytes = await context
                              .read<RondaRepository>()
                              .exportPdf(item.id);
                          final dir = await getTemporaryDirectory();
                          final file = File(
                            '${dir.path}/rondapro-${item.id}.pdf',
                          );
                          await file.writeAsBytes(bytes, flush: true);
                          await Share.shareXFiles(
                            [XFile(file.path, mimeType: 'application/pdf')],
                            text: item.templateName,
                          );
                        } catch (e) {
                          if (!context.mounted) return;
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(content: Text('Could not export PDF: $e')),
                          );
                        }
                      },
                    ),
                ],
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
