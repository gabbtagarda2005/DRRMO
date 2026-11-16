import 'package:flutter/material.dart';
import 'theme.dart';

enum StatusChipVariant { danger, warning, success, info, neutral }

class StatusChip extends StatelessWidget {
  final String label;
  final StatusChipVariant variant;
  final bool compact;

  const StatusChip({
    super.key,
    required this.label,
    this.variant = StatusChipVariant.neutral,
    this.compact = false,
  });

  Color get _backgroundColor {
    switch (variant) {
      case StatusChipVariant.danger:
        return const Color(0xFF7F1D1D).withOpacity(0.16);
      case StatusChipVariant.warning:
        return const Color(0xFF92400E).withOpacity(0.16);
      case StatusChipVariant.success:
        return const Color(0xFF166534).withOpacity(0.16);
      case StatusChipVariant.info:
        return const Color(0xFF0F766E).withOpacity(0.16);
      case StatusChipVariant.neutral:
      default:
        return const Color(0xFF334155).withOpacity(0.16);
    }
  }

  Color get _textColor {
    switch (variant) {
      case StatusChipVariant.danger:
        return const Color(0xFFEF4444);
      case StatusChipVariant.warning:
        return const Color(0xFFF59E0B);
      case StatusChipVariant.success:
        return const Color(0xFF22C55E);
      case StatusChipVariant.info:
        return const Color(0xFF2DD4BF);
      case StatusChipVariant.neutral:
      default:
        return const Color(0xFFCBD5E1);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: compact ? 10 : 14,
        vertical: compact ? 6 : 8,
      ),
      decoration: BoxDecoration(
        color: _backgroundColor,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: _textColor,
          fontSize: compact ? 11 : 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class StatCard extends StatelessWidget {
  final String label;
  final String value;
  final String hint;
  final IconData icon;
  final DrrmoTheme theme;

  const StatCard({
    super.key,
    required this.label,
    required this.value,
    required this.hint,
    required this.icon,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      color: theme.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24),
        side: BorderSide(color: theme.primary.withOpacity(0.16)),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: theme.primary.withOpacity(0.12),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(icon, color: theme.primary, size: 26),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      color: theme.onSurface.withOpacity(0.72),
                      fontSize: 12,
                      letterSpacing: 0.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    value,
                    style: TextStyle(
                      color: theme.onSurface,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    hint,
                    style: TextStyle(
                      color: theme.onSurface.withOpacity(0.64),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class ProgressStep {
  final String label;
  final String? description;

  const ProgressStep({
    required this.label,
    this.description,
  });
}

class ProgressTracker extends StatelessWidget {
  final List<ProgressStep> steps;
  final int currentIndex;
  final Color accentColor;
  final bool isDark;

  const ProgressTracker({
    super.key,
    required this.steps,
    this.currentIndex = 0,
    this.accentColor = Colors.blue,
    this.isDark = false,
  });

  Color get _inactiveColor => isDark ? Colors.white24 : Colors.black26;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(steps.length, (index) {
        final step = steps[index];
        final active = index <= currentIndex;
        final dotColor = active ? accentColor : _inactiveColor;
        final textColor = active ? Colors.white : Colors.white70;
        return Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Container(
                      width: 18,
                      height: 18,
                      decoration: BoxDecoration(
                        color: dotColor,
                        shape: BoxShape.circle,
                      ),
                    ),
                    if (index < steps.length - 1)
                      Container(
                        width: 2,
                        height: 32,
                        margin: const EdgeInsets.only(top: 4),
                        color: _inactiveColor,
                      ),
                  ],
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        step.label,
                        style: TextStyle(
                          color: textColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      if (step.description != null)
                        Padding(
                          padding: const EdgeInsets.only(top: 4),
                          child: Text(
                            step.description!,
                            style: TextStyle(
                              color: textColor.withOpacity(0.72),
                              fontSize: 12,
                            ),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
            if (index < steps.length - 1) const SizedBox(height: 12),
          ],
        );
      }),
    );
  }
}
