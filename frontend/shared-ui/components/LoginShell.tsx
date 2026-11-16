import type { ReactNode } from 'react';
import { appThemes } from '../themes';
import type { RoleProfileKey } from '@shared/roleProfiles';

interface LoginShellProps {
  profileKey: RoleProfileKey;
  title: string;
  children: ReactNode;
}

const roleSubtitle: Record<RoleProfileKey, string> = {
  admin: 'INFRASTRUCTURE ACCESS CONFIGURATION',
  drrmo_officer: 'CENTRAL COMMAND STATION',
  responder: 'FIELD EMERGENCY COMMUNICATIONS HUB',
  barangay_official: 'LOCAL BARANGAY COORDINATION DESK',
  citizen: 'CITIZEN INCIDENT REPORTING PORTAL',
};

export function LoginShell({ profileKey, title, children }: LoginShellProps) {
  const theme = appThemes[profileKey];
  const accent = theme.accent;

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.18),_transparent_28%),radial-gradient(circle_at_top_right,_rgba(249,115,22,0.12),_transparent_24%),radial-gradient(circle_at_bottom,_rgba(16,185,129,0.10),_transparent_22%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-1/2 h-96 -translate-y-1/2">
        <div className="absolute left-20 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="absolute right-20 top-10 h-72 w-72 translate-x-1/2 rounded-full bg-orange-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">
        <div className="w-full max-w-xl">
          <div
            className="relative overflow-hidden rounded-[2rem] border border-white/15 bg-white/10 p-10 shadow-2xl shadow-slate-950/40 backdrop-blur-3xl"
            style={{ boxShadow: `0 0 80px 24px ${accent}22` }}
          >
            <div className="absolute inset-x-0 -top-16 flex justify-center">
              <div className="relative rounded-full border border-white/20 bg-slate-950/90 p-3 shadow-2xl shadow-sky-500/15">
                <img
                  src="/drrmo-seal.png"
                  alt="DRRMO official seal"
                  className="h-28 w-28 rounded-full object-cover"
                />
              </div>
            </div>

            <div className="mt-20 text-center">
              <p className="text-xs uppercase tracking-[0.34em] text-slate-400">DRRMO secure access</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">{title}</h1>
              <p className="mx-auto mt-4 max-w-md text-sm uppercase tracking-[0.3em] text-slate-300">
                {roleSubtitle[profileKey]}
              </p>
            </div>

            <div className="mt-10">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
