import 'package:flutter/material.dart';

class CitizenNavItem {
  const CitizenNavItem({
    required this.featureId,
    required this.branchIndex,
    required this.title,
    required this.icon,
    required this.selectedIcon,
    required this.label,
  });

  final String featureId;
  final int branchIndex;
  final String title;
  final IconData icon;
  final IconData selectedIcon;
  final String label;
}

const citizenNavItems = [
  CitizenNavItem(
    featureId: 'tab_home',
    branchIndex: 0,
    title: 'Home',
    icon: Icons.home_outlined,
    selectedIcon: Icons.home,
    label: 'Home',
  ),
  CitizenNavItem(
    featureId: 'tab_report',
    branchIndex: 1,
    title: 'Report',
    icon: Icons.emergency_outlined,
    selectedIcon: Icons.emergency,
    label: 'Report',
  ),
  CitizenNavItem(
    featureId: 'tab_requests',
    branchIndex: 2,
    title: 'Requests',
    icon: Icons.list_alt_outlined,
    selectedIcon: Icons.list_alt,
    label: 'Requests',
  ),
  CitizenNavItem(
    featureId: 'tab_alerts',
    branchIndex: 3,
    title: 'Alerts',
    icon: Icons.notifications_outlined,
    selectedIcon: Icons.notifications,
    label: 'Alerts',
  ),
  CitizenNavItem(
    featureId: 'tab_evacuations',
    branchIndex: 4,
    title: 'Evacuations',
    icon: Icons.map_outlined,
    selectedIcon: Icons.map,
    label: 'Zones',
  ),
  CitizenNavItem(
    featureId: 'tab_hotlines',
    branchIndex: 5,
    title: 'Hotlines',
    icon: Icons.phone_outlined,
    selectedIcon: Icons.phone,
    label: 'Hotlines',
  ),
];
