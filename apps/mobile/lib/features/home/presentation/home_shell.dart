import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/l10n/app_strings.dart';
import '../../auth/presentation/auth_controller.dart';
import '../../dashboard/presentation/panel_screen.dart';
import '../../rondas/presentation/history_list_screen.dart';
import '../../templates/presentation/templates_list_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;

  Widget _page(int index) {
    switch (index) {
      case 1:
        return const HistoryListScreen();
      case 2:
        return const PanelScreen();
      default:
        return const TemplatesListScreen(embedded: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    final s = S.of(context);
    final titles = [s.templates, s.history, s.panel];
    final role = auth.user?.role ?? 'auditor';
    return Scaffold(
      appBar: AppBar(
        title: Text('${titles[_index]} · ${s.roleLabel(role)}'),
        actions: [
          IconButton(
            tooltip: s.signOut,
            onPressed: auth.logout,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: _page(_index),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: (value) {
          if (value == _index) {
            return;
          }
          setState(() => _index = value);
        },
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.checklist_outlined),
            selectedIcon: const Icon(Icons.checklist),
            label: s.templates,
          ),
          NavigationDestination(
            icon: const Icon(Icons.history_outlined),
            selectedIcon: const Icon(Icons.history),
            label: s.history,
          ),
          NavigationDestination(
            icon: const Icon(Icons.space_dashboard_outlined),
            selectedIcon: const Icon(Icons.space_dashboard),
            label: s.panel,
          ),
        ],
      ),
    );
  }
}
