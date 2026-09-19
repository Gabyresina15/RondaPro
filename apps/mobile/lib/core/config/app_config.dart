/// Runtime configuration for the RondaPro mobile client.
class AppConfig {
  AppConfig._();

  /// Base URL of the RondaPro API (no trailing slash).
  /// Override with `--dart-define=API_BASE_URL=http://10.0.2.2:3000` for Android emulator.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://127.0.0.1:3000',
  );
}
