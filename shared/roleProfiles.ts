export type RoleProfileKey =
  | 'admin'
  | 'drrmo_officer'
  | 'responder'
  | 'barangay_official'
  | 'citizen';

export interface RoleNavItem {
  name: string;
  path: string;
  icon:
    | 'home'
    | 'users'
    | 'incidents'
    | 'reports'
    | 'settings'
    | 'audit'
    | 'evacuation'
    | 'resources'
    | 'alerts'
    | 'map'
    | 'assignments'
    | 'damage'
    | 'assistance'
    | 'emergency'
    | 'hotline';
}

export interface RoleProfile {
  key: RoleProfileKey;
  brandName: string;
  platform: string;
  roleTitle: string;
  purpose: string;
  mainFunction: string;
  responsibilities: string[];
  workflowLabel: string;
  navigation: RoleNavItem[];
}

export const roleProfiles: Record<RoleProfileKey, RoleProfile> = {
  admin: {
    key: 'admin',
    brandName: 'DRRMO Admin',
    platform: 'Web Application',
    roleTitle: 'System Administrator',
    purpose: 'Manage and maintain the entire DRRMO system infrastructure.',
    mainFunction: 'System control, security, and maintenance.',
    workflowLabel: 'System oversight and secure operations',
    responsibilities: [
      'Create and manage user accounts',
      'Assign user roles and permissions',
      'Configure system settings',
      'Monitor system activity logs',
      'Maintain database backups',
      'Manage system security and authentication',
      'Ensure system availability and performance',
    ],
    navigation: [
      { name: 'Dashboard', path: '/dashboard', icon: 'home' },
      { name: 'Users', path: '/users', icon: 'users' },
      { name: 'Incidents', path: '/incidents', icon: 'incidents' },
      { name: 'Audit Logs', path: '/audit-logs', icon: 'audit' },
      { name: 'Settings', path: '/settings', icon: 'settings' },
      { name: 'System Reports', path: '/reports', icon: 'reports' },
    ],
  },
  drrmo_officer: {
    key: 'drrmo_officer',
    brandName: 'DRRMO Officer',
    platform: 'Web Application',
    roleTitle: 'DRRMO Officer (Command Center)',
    purpose: 'Serve as the central command and decision-maker during emergencies and disasters.',
    mainFunction: 'Emergency monitoring and rescue coordination.',
    workflowLabel: 'Command center — monitor, assign, and coordinate',
    responsibilities: [
      'Monitor real-time incidents and disaster reports',
      'Assign emergency responders and rescue teams',
      'Coordinate rescue operations',
      'Manage evacuation centers',
      'Track emergency resources and vehicles',
      'Send disaster alerts and announcements',
      'Monitor disaster maps and heatmaps',
      'Generate reports and disaster analytics',
    ],
    navigation: [
      { name: 'Command Dashboard', path: '/dashboard', icon: 'home' },
      { name: 'Incidents', path: '/incidents', icon: 'incidents' },
      { name: 'Responders', path: '/responders', icon: 'users' },
      { name: 'Evacuation Centers', path: '/evacuations', icon: 'evacuation' },
      { name: 'Resources', path: '/resources', icon: 'resources' },
      { name: 'Alerts', path: '/alerts', icon: 'alerts' },
      { name: 'Disaster Map', path: '/maps', icon: 'map' },
      { name: 'Reports', path: '/reports', icon: 'reports' },
    ],
  },
  responder: {
    key: 'responder',
    brandName: 'DRRMO Responder',
    platform: 'Flutter Mobile Application',
    roleTitle: 'Emergency Responder (Field Personnel)',
    purpose: 'Frontline rescue personnel deployed to disaster areas.',
    mainFunction: 'Field rescue operations and incident response.',
    workflowLabel: 'Field operations — receive tasks and report status',
    responsibilities: [
      'Receive emergency assignments from DRRMO officers',
      'Navigate to disaster locations using GPS',
      'Update rescue operation status',
      'Upload field photos and videos',
      'Submit incident and rescue reports',
      'Communicate real-time updates from the field',
      'Confirm rescue completion status',
    ],
    navigation: [
      { name: 'Field Dashboard', path: '/dashboard', icon: 'home' },
      { name: 'My Assignments', path: '/assignments', icon: 'assignments' },
      { name: 'Active Operations', path: '/incidents', icon: 'incidents' },
      { name: 'Field Reports', path: '/reports', icon: 'reports' },
      { name: 'Route Map', path: '/maps', icon: 'map' },
    ],
  },
  barangay_official: {
    key: 'barangay_official',
    brandName: 'DRRMO Barangay',
    platform: 'Web Application',
    roleTitle: 'Barangay Official',
    purpose: 'Local coordination between the community and the DRRMO office.',
    mainFunction: 'Barangay-level disaster coordination and reporting.',
    workflowLabel: 'Barangay coordination — verify and request assistance',
    responsibilities: [
      'Report incidents occurring within the barangay',
      'Monitor evacuation centers within their area',
      'Submit damage assessment reports',
      'Request rescue assistance and relief supplies',
      'Disseminate warnings and advisories to residents',
      'Monitor affected residents and local conditions',
      'Coordinate with DRRMO during emergencies',
    ],
    navigation: [
      { name: 'Barangay Dashboard', path: '/dashboard', icon: 'home' },
      { name: 'Report Incident', path: '/incidents', icon: 'incidents' },
      { name: 'Evacuation Centers', path: '/evacuations', icon: 'evacuation' },
      { name: 'Damage Assessment', path: '/damage-assessment', icon: 'damage' },
      { name: 'Assistance Requests', path: '/assistance', icon: 'assistance' },
      { name: 'Advisories', path: '/alerts', icon: 'alerts' },
    ],
  },
  citizen: {
    key: 'citizen',
    brandName: 'DRRMO Citizen',
    platform: 'Flutter Mobile Application',
    roleTitle: 'Citizen / Resident',
    purpose: 'Community users who report emergencies and receive disaster-related information.',
    mainFunction: 'Emergency reporting and public communication.',
    workflowLabel: 'Public reporting — alert, request help, stay informed',
    responsibilities: [
      'Report emergencies using GPS and media uploads',
      'Request emergency assistance',
      'Receive disaster alerts and evacuation notices',
      'View evacuation center locations',
      'Access emergency hotlines and announcements',
      'Track rescue response status',
    ],
    navigation: [
      { name: 'Home', path: '/dashboard', icon: 'home' },
      { name: 'Report Emergency', path: '/report', icon: 'emergency' },
      { name: 'My Requests', path: '/requests', icon: 'assistance' },
      { name: 'Alerts', path: '/alerts', icon: 'alerts' },
      { name: 'Evacuation Centers', path: '/evacuations', icon: 'evacuation' },
      { name: 'Emergency Hotlines', path: '/hotlines', icon: 'hotline' },
    ],
  },
};

export const SYSTEM_FLOW_STEPS = [
  'Citizen reports emergency',
  'Barangay Official verifies and updates reports',
  'DRRMO Officer receives and monitors the incident',
  'Responder team is assigned',
  'Responder updates field operation status',
  'DRRMO monitors and coordinates rescue',
  'System logs and stores all activities',
] as const;
