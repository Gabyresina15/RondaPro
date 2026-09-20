import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/l10n/app_strings.dart';
import '../../rondas/domain/ronda.dart';
import '../../rondas/presentation/ronda_detail_screen.dart';
import '../../rondas/presentation/rondas_controller.dart';
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
      if (!mounted) {
        return;
      }
      context.read<DashboardController>().load();
      context.read<SitesController>().load();
      context.read<RondasController>().loadHistory();
    });
  }

  Future<void> _refresh() async {
    await Future.wait([
      context.read<DashboardController>().load(),
      context.read<SitesController>().load(),
      context.read<RondasController>().loadHistory(),
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
          title: Text(S.of(context).newSite),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(
                  controller: name,
                  decoration: InputDecoration(labelText: S.of(context).name),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: address,
                  decoration: InputDecoration(labelText: S.of(context).address),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: notes,
                  decoration: InputDecoration(labelText: S.of(context).notes),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: Text(S.of(context).cancel),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(context, true),
              child: Text(S.of(context).create),
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
    final rondas = context.watch<RondasController>();
    final stats = dashboard.stats;
    final openFindings = <({Ronda ronda, RondaFinding finding})>[
      for (final ronda in rondas.items)
        for (final finding in ronda.findings)
          if (finding.isOpen) (ronda: ronda, finding: finding),
    ];

    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          Text(S.of(context).dashboard, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 12),
          if (dashboard.loading && stats == null)
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: SizedBox(
                height: 32,
                width: 32,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            )
          else if (dashboard.error != null && stats == null)
            Text(dashboard.error ?? 'No se pudo cargar el panel')
          else if (stats != null)
            Column(
              children: [
                _StatTile(label: S.of(context).sites, value: '${stats.sitesCount}'),
                _StatTile(label: S.of(context).templates, value: '${stats.templatesCount}'),
                _StatTile(
                  label: S.of(context).inProgress,
                  value: '${stats.rondasInProgress}',
                ),
                _StatTile(
                  label: S.of(context).completed,
                  value: '${stats.rondasCompleted}',
                ),
                _StatTile(label: S.of(context).photos, value: '${stats.photosTotal}'),
                _StatTile(
                  label: S.of(context).openFindings,
                  value: '${stats.findingsOpen}',
                ),
                _StatTile(
                  label: S.of(context).highSeverity,
                  value: '${stats.findingsHigh}',
                ),
              ],
            ),
          const SizedBox(height: 24),
          Text(S.of(context).openFindings, style: Theme.of(context).textTheme.titleLarge),
          const SizedBox(height: 8),
          if (openFindings.isEmpty)
            Text(S.of(context).noOpenFindings)
          else
            ...openFindings.map(
              (entry) => Card(
                child: ListTile(
                  leading: const Icon(Icons.flag_outlined),
                  title: Text(entry.finding.title),
                  subtitle: Text(
                    [
                      entry.ronda.siteName ?? entry.ronda.templateName,
                      entry.finding.severity,
                    ].join(' · '),
                  ),
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => RondaDetailScreen(ronda: entry.ronda),
                      ),
                    );
                  },
                ),
              ),
            ),
          const SizedBox(height: 24),
          ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(S.of(context).sites, style: Theme.of(context).textTheme.titleLarge),
            trailing: IconButton(
              tooltip: S.of(context).newSite,
              onPressed: _createSite,
              icon: const Icon(Icons.add),
            ),
          ),
          if (sites.items.isEmpty)
            const Text('Todavía no hay sitios. Agregá un local.')
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

class _StatTile extends StatelessWidget {
  const _StatTile({required this.label, required this.value});

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      dense: true,
      title: Text(label),
      trailing: Text(
        value,
        style: Theme.of(context).textTheme.titleMedium,
      ),
    );
  }
}
