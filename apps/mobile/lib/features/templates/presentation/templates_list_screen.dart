import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../auth/presentation/auth_controller.dart';
import '../../rondas/presentation/perform_ronda_screen.dart';
import '../../rondas/presentation/rondas_controller.dart';
import '../../sites/domain/site.dart';
import '../../sites/presentation/sites_controller.dart';
import 'create_template_screen.dart';
import 'templates_controller.dart';

class TemplatesListScreen extends StatefulWidget {
  const TemplatesListScreen({super.key, this.embedded = false});

  final bool embedded;

  @override
  State<TemplatesListScreen> createState() => _TemplatesListScreenState();
}

class _TemplatesListScreenState extends State<TemplatesListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TemplatesController>().load();
      context.read<SitesController>().load();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final templates = context.watch<TemplatesController>();

    final fab = FloatingActionButton.extended(
      onPressed: () async {
        final created = await Navigator.of(context).push<bool>(
          MaterialPageRoute(
            builder: (_) => const CreateTemplateScreen(),
          ),
        );
        if (created == true && mounted) {
          await context.read<TemplatesController>().load();
        }
      },
      icon: const Icon(Icons.add),
      label: const Text('New template'),
    );

    if (widget.embedded) {
      return Stack(
        children: [
          _buildBody(templates, auth),
          Positioned(
            right: 16,
            bottom: 16,
            child: fab,
          ),
        ],
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Checklist templates'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            onPressed: templates.loading ? null : () => templates.load(),
            icon: const Icon(Icons.refresh),
          ),
          IconButton(
            tooltip: 'Sign out',
            onPressed: () => auth.logout(),
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      floatingActionButton: fab,
      body: _buildBody(templates, auth),
    );
  }

  Future<void> _startRonda(BuildContext context, String templateId) async {
    final sites = context.read<SitesController>().items;
    final locationController = TextEditingController();
    Site? selected = sites.isEmpty ? null : sites.first;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setLocal) {
            return AlertDialog(
              title: const Text('Start ronda'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (sites.isNotEmpty)
                    DropdownButtonFormField<Site>(
                      value: selected,
                      items: sites
                          .map(
                            (site) => DropdownMenuItem(
                              value: site,
                              child: Text(site.name),
                            ),
                          )
                          .toList(),
                      onChanged: (value) => setLocal(() => selected = value),
                      decoration: const InputDecoration(labelText: 'Site'),
                    ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: locationController,
                    decoration: const InputDecoration(
                      labelText: 'Extra location note',
                      hintText: 'Aisle 4 / back office',
                    ),
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
                  child: const Text('Start'),
                ),
              ],
            );
          },
        );
      },
    );
    if (confirmed != true || !context.mounted) {
      return;
    }
    final ronda = await context.read<RondasController>().start(
          templateId: templateId,
          location: locationController.text.trim(),
          siteId: selected?.id,
        );
    if (!context.mounted) {
      return;
    }
    if (ronda == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            context.read<RondasController>().error ?? 'Could not start ronda',
          ),
        ),
      );
      return;
    }
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => PerformRondaScreen(ronda: ronda),
      ),
    );
    if (context.mounted) {
      await context.read<RondasController>().loadHistory();
    }
  }

  Widget _buildBody(TemplatesController templates, AuthController auth) {
    if (templates.loading && templates.items.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }
    if (templates.error != null && templates.items.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(templates.error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton(
                onPressed: () => templates.load(),
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
      );
    }
    if (templates.items.isEmpty) {
      return Center(
        child: Text(
          'No templates yet.\nCreate one for ${auth.session?.user.name ?? 'your team'}.',
          textAlign: TextAlign.center,
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: templates.load,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 88),
        itemCount: templates.items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (context, index) {
          final item = templates.items[index];
          return Card(
            child: ListTile(
              title: Text(item.name),
              subtitle: Text(
                item.description.isEmpty
                    ? '${item.items.length} item(s) · tap to start ronda'
                    : '${item.description}\n${item.items.length} item(s) · tap to start ronda',
              ),
              isThreeLine: item.description.isNotEmpty,
              leading: CircleAvatar(
                child: Text('${item.items.length}'),
              ),
              onTap: () => _startRonda(context, item.id),
            ),
          );
        },
      ),
    );
  }
}
