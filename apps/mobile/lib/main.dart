import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';

import 'core/network/api_client.dart';
import 'core/theme/app_theme.dart';
import 'features/auth/data/auth_repository.dart';
import 'features/auth/presentation/auth_controller.dart';
import 'features/auth/presentation/login_screen.dart';
import 'features/dashboard/data/dashboard_repository.dart';
import 'features/dashboard/presentation/dashboard_controller.dart';
import 'features/home/presentation/home_shell.dart';
import 'features/notifications/data/notification_repository.dart';
import 'features/notifications/presentation/notifications_controller.dart';
import 'features/rondas/data/ronda_repository.dart';
import 'features/rondas/presentation/rondas_controller.dart';
import 'features/sites/data/site_repository.dart';
import 'features/sites/presentation/sites_controller.dart';
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
    final siteRepository = SiteRepository(api);
    final dashboardRepository = DashboardRepository(api);
    final notificationRepository = NotificationRepository(api);

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
        ChangeNotifierProvider(
          create: (_) => SitesController(siteRepository),
        ),
        ChangeNotifierProvider(
          create: (_) => DashboardController(dashboardRepository),
        ),
        ChangeNotifierProvider(
          create: (_) => NotificationsController(notificationRepository),
        ),
      ],
      child: MaterialApp(
        title: 'RondaPro',
        theme: AppTheme.light,
        debugShowCheckedModeBanner: false,
        locale: const Locale('es'),
        supportedLocales: const [Locale('es'), Locale('en')],
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
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
