import 'package:flutter/material.dart';

class DrrmoTheme {
  final String brandName;
  final Color primary;
  final Color scaffoldBackground;
  final Color surface;
  final Color onPrimary;
  final Color onSurface;

  const DrrmoTheme({
    required this.brandName,
    required this.primary,
    required this.scaffoldBackground,
    required this.surface,
    required this.onPrimary,
    required this.onSurface,
  });

  static const citizen = DrrmoTheme(
    brandName: 'DRRMO Citizen',
    primary: Color(0xFF0E4A94),
    scaffoldBackground: Color(0xFF07101F),
    surface: Color(0xFF0A1223),
    onPrimary: Colors.white,
    onSurface: Color(0xFFE2E8F0),
  );

  static const responder = DrrmoTheme(
    brandName: 'DRRMO Responder',
    primary: Color(0xFF0E9775),
    scaffoldBackground: Color(0xFF071116),
    surface: Color(0xFF0A141F),
    onPrimary: Colors.white,
    onSurface: Color(0xFFE2E8F0),
  );

  ThemeData toThemeData() {
    final colorScheme = ColorScheme.fromSeed(
      seedColor: primary,
      brightness: Brightness.dark,
      background: scaffoldBackground,
      surface: surface,
      onPrimary: onPrimary,
      onSurface: onSurface,
    );

    return ThemeData.from(colorScheme: colorScheme, useMaterial3: true).copyWith(
      scaffoldBackgroundColor: scaffoldBackground,
      cardColor: surface,
      canvasColor: scaffoldBackground,
      appBarTheme: AppBarTheme(
        backgroundColor: surface,
        foregroundColor: onSurface,
        elevation: 0,
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: primary,
          foregroundColor: onPrimary,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: onPrimary,
          side: BorderSide(color: onPrimary.withOpacity(0.16)),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(foregroundColor: primary),
      ),
    );
  }
}
