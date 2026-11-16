import { useState, type FormEvent } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, ArrowRight } from 'lucide-react';
import type { RoleProfileKey } from '@shared/roleProfiles';
import { appThemes } from '../themes';
import { cn } from '../lib/cn';

interface LoginViewProps {
  profileKey: RoleProfileKey;
  title: string;
  email: string;
  password: string;
  error: string | null;
  isLoading: boolean;
  demoEmail: string;
  demoPassword: string;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onFillDemo: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
}

const roleSubtitles: Record<RoleProfileKey, string> = {
  admin: 'Sign in to manage infrastructure, accounts, and system-wide access.',
  drrmo_officer: 'Sign in to coordinate response operations from central command.',
  responder: 'Sign in to receive dispatches and report from the field.',
  barangay_official: 'Sign in to coordinate incidents for your barangay.',
  citizen: 'Sign in to report incidents and track your community.',
};

// Lighter than the brand accent so it reads clearly on the dark glass card.
const highlightColors: Record<RoleProfileKey, string> = {
  citizen: '#FCA5A5',
  barangay_official: '#6EE7B7',
  responder: '#FCD34D',
  drrmo_officer: '#93C5FD',
  admin: '#CBD5E1',
};

export function LoginView({
  profileKey,
  title,
  email,
  password,
  error,
  isLoading,
  demoEmail,
  demoPassword,
  onEmailChange,
  onPasswordChange,
  onFillDemo,
  onSubmit,
}: LoginViewProps) {
  const theme = appThemes[profileKey];
  const highlight = highlightColors[profileKey];
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#0a0e2a]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#080b24_0%,#1a1547_35%,#3b2266_68%,#5c3d7d_100%)]" />
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(1.5px 1.5px at 10% 12%, #fff, transparent), radial-gradient(1px 1px at 32% 28%, #fff, transparent), radial-gradient(1.5px 1.5px at 58% 8%, #fff, transparent), radial-gradient(1px 1px at 78% 22%, #fff, transparent), radial-gradient(1.5px 1.5px at 88% 6%, #fff, transparent), radial-gradient(1px 1px at 18% 38%, #fff, transparent), radial-gradient(1px 1px at 68% 34%, #fff, transparent)',
          backgroundSize: '100% 45%',
          backgroundRepeat: 'no-repeat',
        }}
      />
      <div
        className="pointer-events-none absolute -left-32 bottom-0 h-80 w-80 rounded-full blur-3xl"
        style={{ background: `${theme.accent}33` }}
      />
      <div
        className="pointer-events-none absolute -right-32 bottom-0 h-80 w-80 rounded-full blur-3xl"
        style={{ background: `${theme.accent}33` }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div
          className="w-full max-w-md rounded-[32px] border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-2xl sm:p-10"
          style={{ boxShadow: `0 30px 90px -20px rgba(0,0,0,0.55), 0 0 60px -12px ${theme.accent}40` }}
        >
          <div className="flex flex-col items-center text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10"
              style={{ boxShadow: `0 0 0 1px ${theme.accent}55, 0 8px 24px -6px ${theme.accent}66` }}
            >
              <ShieldCheck size={26} style={{ color: highlight }} />
            </div>
            <h1 className="mt-6 text-3xl font-semibold text-white">
              Welcome <span style={{ color: highlight }}>back!</span>
            </h1>
            <p className="mx-auto mt-3 max-w-xs text-sm text-slate-300">{roleSubtitles[profileKey]}</p>
          </div>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <label className="block">
              <span className="text-xs font-medium text-slate-300">Email</span>
              <div className="mt-1.5 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 transition focus-within:border-white/30">
                <Mail size={17} className="shrink-0 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(event) => onEmailChange(event.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
                  required
                />
              </div>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-slate-300">Password</span>
              <div className="mt-1.5 flex items-center gap-3 rounded-2xl border border-white/15 bg-white/5 px-4 py-3 transition focus-within:border-white/30">
                <Lock size={17} className="shrink-0 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => onPasswordChange(event.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="shrink-0 text-slate-400 transition hover:text-slate-200"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </label>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-white/30 bg-white/10"
                  style={{ accentColor: theme.accent }}
                />
                Remember me
              </label>
              <button type="button" className="font-medium text-slate-300 transition hover:text-white">
                Forgot password?
              </button>
            </div>

            {error ? (
              <p className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isLoading}
              className={cn(
                'w-full rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-slate-900 shadow-lg transition active:scale-[0.98]',
                isLoading ? 'cursor-not-allowed opacity-70' : 'hover:bg-slate-100'
              )}
            >
              {isLoading ? 'Signing in...' : 'Log In'}
            </button>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-white/15" />
              Demo access
              <span className="h-px flex-1 bg-white/15" />
            </div>

            <button
              type="button"
              onClick={onFillDemo}
              className="flex w-full items-center justify-between rounded-2xl border border-dashed border-white/20 bg-white/5 px-4 py-3 text-left text-xs text-slate-300 transition hover:border-white/35 hover:bg-white/10"
            >
              <span>
                <span className="block font-mono text-slate-200">{demoEmail}</span>
                <span className="block font-mono text-slate-400">{demoPassword}</span>
              </span>
              <span className="flex items-center gap-1 font-semibold text-white">
                Use demo <ArrowRight size={14} />
              </span>
            </button>
          </form>

          <p className="mt-6 text-center text-xs uppercase tracking-[0.2em] text-slate-500">{title}</p>
        </div>
      </div>
    </div>
  );
}
