import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { KeyRound, UserRound } from 'lucide-react';
import { usersApi } from '@shared/src/services';
import { errorMessage, humanize } from '@shared/src/format';
import { Field, inputClass } from './Modal';
import { Notice, LoadingState, ErrorState } from './Feedback';
import { cn } from '../lib/cn';

/** Profile + password panels backed by `/users/me`. */
export function AccountSettings({ accentClass = 'bg-slate-800 hover:bg-slate-900' }: { accentClass?: string }) {
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ['me'], queryFn: usersApi.me });

  const [profile, setProfile] = useState({ firstName: '', lastName: '', phone: '' });
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState<string | null>(null);

  useEffect(() => {
    if (me.data) setProfile({ firstName: me.data.firstName, lastName: me.data.lastName, phone: me.data.phone ?? '' });
  }, [me.data]);

  const saveProfile = useMutation({
    mutationFn: () => usersApi.updateMe({ firstName: profile.firstName.trim(), lastName: profile.lastName.trim(), phone: profile.phone.trim() }),
    onSuccess: (updated) => queryClient.setQueryData(['me'], updated),
  });

  const changePassword = useMutation({
    mutationFn: () => usersApi.changePassword(pw.current, pw.next),
    onSuccess: () => setPw({ current: '', next: '', confirm: '' }),
  });

  const submitProfile = (e: FormEvent) => {
    e.preventDefault();
    saveProfile.mutate();
  };

  const submitPassword = (e: FormEvent) => {
    e.preventDefault();
    setPwError(null);
    changePassword.reset();
    if (pw.next.length < 8) return setPwError('New password must be at least 8 characters.');
    if (pw.next !== pw.confirm) return setPwError('New passwords do not match.');
    changePassword.mutate();
  };

  if (me.isLoading) return <LoadingState label="Loading your profile…" />;
  if (me.isError) return <ErrorState message={errorMessage(me.error)} onRetry={() => me.refetch()} />;

  const button = cn('rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50', accentClass);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <UserRound className="h-5 w-5 text-slate-600" />
          Your profile
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          {me.data?.email} · {humanize(me.data?.role)}
          {me.data?.barangay ? ` · ${me.data.barangay}` : ''}
        </p>
        <form onSubmit={submitProfile} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name">
              <input required value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Last name">
              <input required value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <Field label="Phone">
            <input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+63 9xx xxx xxxx" className={inputClass} />
          </Field>
          {saveProfile.isSuccess ? <Notice tone="success">Profile saved.</Notice> : null}
          {saveProfile.isError ? <Notice tone="error">{errorMessage(saveProfile.error)}</Notice> : null}
          <button type="submit" disabled={saveProfile.isPending} className={button}>
            {saveProfile.isPending ? 'Saving…' : 'Save profile'}
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900">
          <KeyRound className="h-5 w-5 text-slate-600" />
          Change password
        </h3>
        <p className="mt-1 text-sm text-slate-500">Use at least 8 characters. You'll stay signed in on this device.</p>
        <form onSubmit={submitPassword} className="mt-5 space-y-4">
          <Field label="Current password">
            <input type="password" autoComplete="current-password" required value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} className={inputClass} />
          </Field>
          <Field label="New password">
            <input type="password" autoComplete="new-password" required value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Confirm new password">
            <input type="password" autoComplete="new-password" required value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} className={inputClass} />
          </Field>
          {pwError ? <Notice tone="error">{pwError}</Notice> : null}
          {changePassword.isError ? <Notice tone="error">{errorMessage(changePassword.error)}</Notice> : null}
          {changePassword.isSuccess ? <Notice tone="success">Password updated.</Notice> : null}
          <button type="submit" disabled={changePassword.isPending} className={button}>
            {changePassword.isPending ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </section>
    </div>
  );
}
