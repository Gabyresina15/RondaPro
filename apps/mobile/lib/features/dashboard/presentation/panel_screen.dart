import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../sites/presentation/sites_controller.dart';
import 'dashboard_controller.dart';

class PanelScreen extends StatefulWidget {
  const PanelScreen({super.key});

  @override
  State<PanelScreen> createState() => _PanelScreenState();
}

class _PanelScreenState extends State<PanelScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DashboardController>().load();
      context.read<SitesController>().load();
    });
  }

  Future<void> _refresh() async {
    await Future.wait([
      context.read<DashboardController>().load(),
      context.read<SitesController>().load(),
    ]);
  }

  Future<void> _createSite() async {
    final name = TextEditingController();
    final address = TextEditingController();
    final notes = TextEditingController();
    final created = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('New site'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: name,
                decoration: const InputDecoration(labelText: 'Name'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: address,
                decoration: const InputDecoration(labelText: 'Address'),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: notes,
                decoration: const InputDecoration(labelText: 'Notes'),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Create'),
            ),
          ],
        );
      },
    );
    if (created != true || !mounted) {
      return;
    }
    if (name.text.trim().isEmpty) {
      return;
    }
    final ok = await context.read<SitesController>().create(
          name: name.text.trim(),
          address: address.text.trim(),
          notes: notes.text.trim(),
        );
    if (ok && mounted) {
      await context.read<DashboardController>().load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final dashboard = context.watch<DashboardController>();
    final sites = context.watch<SitesController>();
    final stats = dashboard.stats;

    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          Text('Dashboard', style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          if (dashboard.loading && stats == null)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(child: CircularProgressIndicator()),
            )
          else if (dashboard.error != null && stats == null)
            Text(dashboard.error!)
          else if (stats != null)
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _StatChip(label: 'Sites', value: '${stats.sitesCount}'),
                _StatChip(label: 'Templates', value: '${stats.templatesCount}'),
                _StatChip(label: 'In progress', value: '${stats.rondasInProgress}'),
                _StatChip(label: 'Completed', value: '${stats.rondasCompleted}'),
                _StatChip(label: 'Photos', value: '${stats.photosTotal}'),
                _StatChip(label: 'Open findings', value: '${stats.findingsOpen}'),
                _StatChip(label: 'High severity', value: '${stats.findingsHigh}'),
              ],
            ),
          const SizedBox(height: 24),
          Row(
            children: [
              Expanded(
                child: Text('Sites', style: Theme.of(context).textTheme.titleLarge),
              ),
              FilledButton.tonalIcon(
                onPressed: _createSite,
                icon: const Icon(Icons.add),
                label: const Text('Add'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (sites.items.isEmpty)
            const Text('No sites yet. Add a store or facility.')
          else
            ...sites.items.map(
              (site) => Card(
                child: ListTile(
                  leading: const Icon(Icons.storefront_outlined),
                  title: Text(site.name),
                  subtitle: Text(
                    site.address.isEmpty ? site.notes : site.address,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _StatChip extends StatelessWidget {
  const _StatChip({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Chip(
      label: Text('$label: $value'),
    );
  }
}
