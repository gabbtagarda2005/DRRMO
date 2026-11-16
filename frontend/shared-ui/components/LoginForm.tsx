import type { FormEvent } from 'react';
import type { RoleProfileKey } from '@shared/roleProfiles';
import { appThemes } from '../themes';
import { cn } from '../lib/cn';

interface LoginFormProps {
  profileKey: RoleProfileKey;
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

const buttonClasses: Record<RoleProfileKey, string> = {
  citizen: 'bg-sky-600 hover:bg-sky-700 focus-visible:ring-sky-200',
  barangay_official: 'bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-200',
  responder: 'bg-orange-600 hover:bg-orange-700 focus-visible:ring-orange-200',
  drrmo_officer: 'bg-slate-900 hover:bg-slate-800 focus-visible:ring-slate-200',
  admin: 'bg-slate-700 hover:bg-slate-800 focus-visible:ring-slate-200',
};

const inputFocusRing: Record<RoleProfileKey, string> = {
  citizen: 'focus-within:ring-sky-400/40',
  barangay_official: 'focus-within:ring-emerald-400/40',
  responder: 'focus-within:ring-orange-400/40',
  drrmo_officer: 'focus-within:ring-slate-400/40',
  admin: 'focus-within:ring-slate-400/40',
};

const demoBoxClasses: Record<RoleProfileKey, string> = {
  citizen: 'border-sky-500/20 bg-sky-500/5',
  barangay_official: 'border-emerald-500/20 bg-emerald-500/5',
  responder: 'border-orange-500/20 bg-orange-500/5',
  drrmo_officer: 'border-slate-300/20 bg-slate-300/5',
  admin: 'border-slate-300/20 bg-slate-300/5',
};

const demoLabelClasses: Record<RoleProfileKey, string> = {
  citizen: 'text-sky-200',
  barangay_official: 'text-emerald-200',
  responder: 'text-orange-200',
  drrmo_officer: 'text-slate-200',
  admin: 'text-slate-200',
};

const demoLinkClasses: Record<RoleProfileKey, string> = {
  citizen: 'text-sky-300 hover:text-sky-200',
  barangay_official: 'text-emerald-300 hover:text-emerald-200',
  responder: 'text-orange-300 hover:text-orange-200',
  drrmo_officer: 'text-slate-300 hover:text-white',
  admin: 'text-slate-300 hover:text-white',
};

export function LoginForm({
  profileKey,
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
}: LoginFormProps) {
  const theme = appThemes[profileKey];

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-4">
        <label className={cn('block', inputFocusRing[profileKey])} style={{ '--accent-color': theme.accent } as React.CSSProperties}>
          <div className="relative rounded-[1.75rem] border border-white/10 bg-black/20 px-4 pb-2 pt-5 shadow-[0_16px_40px_rgba(15,23,42,0.35)] transition duration-300 focus-within:border-white/20">
            <input
              type="email"
              id="login-email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="Email address"
              className="peer w-full bg-transparent text-white outline-none placeholder:text-transparent"
              required
            />
            <span className="pointer-events-none absolute left-4 top-4 text-sm text-slate-400 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-slate-400 peer-focus:-translate-y-3 peer-focus:text-xs" style={{ color: theme.accent }}>
              Email
            </span>
          </div>
        </label>

        <label className={cn('block', inputFocusRing[profileKey])} style={{ '--accent-color': theme.accent } as React.CSSProperties}>
          <div className="relative rounded-[1.75rem] border border-white/10 bg-black/20 px-4 pb-2 pt-5 shadow-[0_16px_40px_rgba(15,23,42,0.35)] transition duration-300 focus-within:border-white/20">
            <input
              type="password"
              id="login-password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              placeholder="Password"
              className="peer w-full bg-transparent text-white outline-none placeholder:text-transparent"
              required
            />
            <span className="pointer-events-none absolute left-4 top-4 text-sm text-slate-400 transition-all duration-300 peer-placeholder-shown:top-4 peer-placeholder-shown:text-slate-400 peer-focus:-translate-y-3 peer-focus:text-xs" style={{ color: theme.accent }}>
              Password
            </span>
          </div>
        </label>
      </div>

      <div className={cn('rounded-[1.75rem] border p-4', demoBoxClasses[profileKey])} role="note">
        <p className={cn('text-xs font-semibold uppercase tracking-[0.3em]', demoLabelClasses[profileKey])}>
          Demo account
        </p>
        <p className="mt-3 text-sm text-slate-300">
          Email: <span className="font-mono font-medium text-white">{demoEmail}</span>
        </p>
        <p className="text-sm text-slate-300">
          Password: <span className="font-mono font-medium text-white">{demoPassword}</span>
        </p>
        <button
          type="button"
          onClick={onFillDemo}
          className={cn('mt-3 text-sm font-semibold transition', demoLinkClasses[profileKey])}
        >
          Use demo credentials
        </button>
      </div>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <button
        type="submit"
        disabled={isLoading}
        className={cn(
          'w-full rounded-[1.75rem] px-5 py-4 text-base font-semibold text-white transition duration-200 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-60',
          buttonClasses[profileKey],
          isLoading ? 'animate-pulse' : 'hover:-translate-y-0.5'
        )}
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  );
}
