import {
  Home,
  Users,
  AlertTriangle,
  FileBarChart,
  Settings,
  Shield,
  Building2,
  Truck,
  Bell,
  Map,
  ClipboardList,
  Wrench,
  Megaphone,
  Phone,
  Siren,
  type LucideIcon,
} from 'lucide-react';
import type { RoleNavItem } from '@shared/roleProfiles';

const icons: Record<RoleNavItem['icon'], LucideIcon> = {
  home: Home,
  users: Users,
  incidents: AlertTriangle,
  reports: FileBarChart,
  settings: Settings,
  audit: Shield,
  evacuation: Building2,
  resources: Truck,
  alerts: Bell,
  map: Map,
  assignments: ClipboardList,
  damage: Wrench,
  assistance: Megaphone,
  emergency: Siren,
  hotline: Phone,
};

export function getNavIcon(item: RoleNavItem): LucideIcon {
  return icons[item.icon] ?? Home;
}
