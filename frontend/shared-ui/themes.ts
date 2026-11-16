import type { RoleProfileKey } from '@shared/roleProfiles';

export interface AppTheme {
  profileKey: RoleProfileKey;
  accent: string;
  accentHover: string;
  accentMuted: string;
  accentText: string;
  sidebarLogo: string;
  defaultDark: boolean;
  shellBg: string;
  mobileFirst: boolean;
}

export const appThemes: Record<RoleProfileKey, AppTheme> = {
  citizen: {
    profileKey: 'citizen',
    accent: '#DC2626',
    accentHover: '#B91C1C',
    accentMuted: '#FEE2E2',
    accentText: '#FFFFFF',
    sidebarLogo: 'bg-red-600',
    defaultDark: false,
    shellBg: 'bg-slate-50',
    mobileFirst: true,
  },
  barangay_official: {
    profileKey: 'barangay_official',
    accent: '#059669',
    accentHover: '#047857',
    accentMuted: '#D1FAE5',
    accentText: '#FFFFFF',
    sidebarLogo: 'bg-emerald-600',
    defaultDark: false,
    shellBg: 'bg-slate-50',
    mobileFirst: false,
  },
  responder: {
    profileKey: 'responder',
    accent: '#D97706',
    accentHover: '#B45309',
    accentMuted: '#FEF3C7',
    accentText: '#FFFFFF',
    sidebarLogo: 'bg-amber-600',
    defaultDark: true,
    shellBg: 'bg-slate-950',
    mobileFirst: true,
  },
  drrmo_officer: {
    profileKey: 'drrmo_officer',
    accent: '#1E3A8A',
    accentHover: '#1E40AF',
    accentMuted: '#DBEAFE',
    accentText: '#FFFFFF',
    sidebarLogo: 'bg-blue-900',
    defaultDark: false,
    shellBg: 'bg-slate-50',
    mobileFirst: false,
  },
  admin: {
    profileKey: 'admin',
    accent: '#334155',
    accentHover: '#1E293B',
    accentMuted: '#F1F5F9',
    accentText: '#FFFFFF',
    sidebarLogo: 'bg-slate-700',
    defaultDark: false,
    shellBg: 'bg-slate-50',
    mobileFirst: false,
  },
};
