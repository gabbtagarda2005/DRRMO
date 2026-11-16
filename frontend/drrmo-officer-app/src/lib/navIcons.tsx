import {
  HomeIcon,
  UsersIcon,
  ExclamationTriangleIcon,
  DocumentChartBarIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  BuildingOffice2Icon,
  TruckIcon,
  BellAlertIcon,
  MapIcon,
  ClipboardDocumentListIcon,
  WrenchScrewdriverIcon,
  MegaphoneIcon,
  PhoneIcon,
} from '@heroicons/react/24/outline';
import type { RoleNavItem } from '@shared/roleProfiles';

const icons = {
  home: HomeIcon,
  users: UsersIcon,
  incidents: ExclamationTriangleIcon,
  reports: DocumentChartBarIcon,
  settings: Cog6ToothIcon,
  audit: ShieldCheckIcon,
  evacuation: BuildingOffice2Icon,
  resources: TruckIcon,
  alerts: BellAlertIcon,
  map: MapIcon,
  assignments: ClipboardDocumentListIcon,
  damage: WrenchScrewdriverIcon,
  assistance: MegaphoneIcon,
  emergency: ExclamationTriangleIcon,
  hotline: PhoneIcon,
} as const;

export function getNavIcon(item: RoleNavItem) {
  return icons[item.icon] ?? HomeIcon;
}
