import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/network/api_client.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/data/auth_repository.dart';
import 'features/auth/presentation/auth_controller.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/home/presentation/home_shell.dart';
import 'features/rondas/data/ronda_repository.dart';
import 'features/rondas/presentation/rondas_controller.dart';
import 'features/templates/data/template_repository.dart';
import 'features/templates/presentation/templates_controller.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const RondaProApp());
}

class RondaProApp extends StatelessWidget {
  const RondaProApp({super.key});

  @override
  Widget build(BuildContext context) {
    final api = ApiClient();
    final authRepository = AuthRepository(api);
    final templateRepository = TemplateRepository(api);
    final rondaRepository = RondaRepository(api);

    return MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: api),
        Provider<RondaRepository>.value(value: rondaRepository),
        ChangeNotifierProvider(
          create: (_) => AuthController(authRepository),
        ),
        ChangeNotifierProvider(
          create: (_) => TemplatesController(templateRepository),
        ),
        ChangeNotifierProvider(
          create: (_) => RondasController(rondaRepository),
        ),
      ],
      child: MaterialApp(
        title: 'RondaPro',
        theme: AppTheme.light,
        debugShowCheckedModeBanner: false,
        home: const _AuthGate(),
      ),
    );
  }
}

class _AuthGate extends StatelessWidget {
  const _AuthGate();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthController>();
    if (auth.isAuthenticated) {
      return const HomeShell();
    }
    return const LoginScreen();
  }
}
