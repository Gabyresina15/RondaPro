import 'package:flutter/material.dart';

class AppTheme {
  AppTheme._();

  static const Color ink = Color(0xFF0B3D3A);
  static const Color inkDark = Color(0xFF072C2A);
  static const Color accent = Color(0xFFD4A017);
  static const Color canvas = Color(0xFFF4F1EA);
  static const Color card = Color(0xFFFFFCF7);

  static ThemeData get light {
    const scheme = ColorScheme(
      brightness: Brightness.light,
      primary: ink,
      onPrimary: Colors.white,
      secondary: accent,
      onSecondary: Color(0xFF1A1300),
      error: Color(0xFFB42318),
      onError: Colors.white,
      surface: card,
      onSurface: Color(0xFF1B2423),
    );
    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      scaffoldBackgroundColor: canvas,
      fontFamily: 'Roboto',
      appBarTheme: const AppBarTheme(
        backgroundColor: ink,
        foregroundColor: Colors.white,
        centerTitle: false,
        elevation: 0,
      ),
      cardTheme: CardTheme(
        color: card,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: Color(0x1A0B3D3A)),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: Colors.white,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(48),
          backgroundColor: ink,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
      ),
      navigationBarTheme: const NavigationBarThemeData(
        indicatorColor: Color(0x3320A090),
        backgroundColor: Colors.white,
      ),
    );
  }
}
