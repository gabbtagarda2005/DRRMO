import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Activity, ArrowRight, Database, Loader2, Radio, Server, Shield, ShieldOff, Users } from 'lucide-react';
import { ErrorState, LoadingState, PageTitleSync, StatusChip, cn } from '@drrmo/ui';
import { auditApi, systemApi, usersApi, type UserRecord } from '@shared/src/services';
import { errorMessage, formatDuration, fullName, humanize, timeAgo, userIdOf } from '@shared/src/format';
import { useAuth } from './app/providers/AuthProvider';
import { describeAuditEvent } from './lib/audit';

const ROLE_ORDER = ['admin', 'drrmo_officer', 'responder', 'barangay_official', 'citizen'];

export function TacticalDashboard() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const myId = userIdOf(user);

  const health = useQuery({ queryKey: ['system-health'], queryFn: systemApi.health, refetchInterval: 30_000 });
  const users = useQuery({ queryKey: ['users'], queryFn: usersApi.list });
  const audit = useQuery({ queryKey: ['audit', 'recent'], queryFn: () => auditApi.list({ limit: 8 }), refetchInterval: 30_000 });

  const toggleActive = useMutation({
    mutationFn: (u: UserRecord) => usersApi.update(u._id, { isActive: !u.isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['system-health'] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
    },
  });

  const recentUsers = useMemo(() => (users.data ?? []).slice(0, 6), [users.data]);
  const h = health.data;

  const cards = h
    ? [
        {
          label: 'API server',
          value: formatDuration(h.api.uptimeSeconds),
          hint: `Uptime · ${h.api.environment} · ${h.api.memoryMb} MB`,
          icon: Server,
          ok: true,
        },
        {
          label: 'Database',
          value: humanize(h.database.state),
          hint: h.database.latencyMs !== null ? `Ping ${h.database.latencyMs} ms · ${h.database.name}` : 'Ping failed',
          icon: Database,
          ok: h.database.state === 'connected',
        },
        {
          label: 'Sign-ins (24h)',
          value: String(h.activity.logins24h),
          hint: `${h.activity.actions24h} audited actions today`,
          icon: Shield,
          ok: true,
        },
        {
          label: 'Realtime sessions',
          value: String(h.realtime.sessions),
          hint: 'Live Socket.IO connections',
          icon: Radio,
          ok: true,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      <PageTitleSync title="Dashboard" />

      <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-50 to-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">System administration</p>
            <p className="mt-1 text-sm text-slate-600">Infrastructure health · account roster · audit trail</p>
          </div>
          {h ? (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <Activity className="h-3.5 w-3.5" />
              Checked {timeAgo(h.checkedAt)}
            </span>
          ) : null}
        </div>
      </div>

      {health.isLoading ? (
        <LoadingState label="Checking system health…" />
      ) : health.isError ? (
        <ErrorState message={errorMessage(health.error)} onRetry={() => health.refetch()} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.label} className="rounded-2xl border border-slate-100/80 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <div className="rounded-xl bg-slate-100 p-2.5">
                    <Icon className="h-5 w-5 text-slate-700" />
                  </div>
                  <StatusChip label={card.ok ? 'Healthy' : 'Attention'} variant={card.ok ? 'success' : 'danger'} />
                </div>
                <p className="mt-4 text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="text-sm font-medium text-slate-700">{card.label}</p>
                <p className="mt-0.5 text-xs text-slate-500">{card.hint}</p>
              </article>
            );
          })}
        </div>
      )}

      {h ? (
        <section className="rounded-2xl border border-slate-100/80 bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-semibold text-slate-900">Accounts by role</h2>
            <p className="text-xs text-slate-500">
              {h.users.total} total · {h.users.active} active · {h.users.suspended} suspended
            </p>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {ROLE_ORDER.map((role) => (
              <div key={role} className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xl font-bold text-slate-900">{h.users.byRole[role] ?? 0}</p>
                <p className="text-xs font-medium text-slate-500">{humanize(role)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <section className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-sm lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100/80 px-5 py-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-slate-700" />
              <div>
                <h2 className="font-semibold text-slate-900">Newest accounts</h2>
                <p className="text-xs text-slate-500">Suspend or reactivate access instantly</p>
              </div>
            </div>
            <Link to="/users" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900">
              Manage all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {users.isLoading ? (
            <LoadingState className="rounded-none border-0" />
          ) : users.isError ? (
            <ErrorState className="m-4" message={errorMessage(users.error)} onRetry={() => users.refetch()} />
          ) : (
            <ul className="divide-y divide-slate-50">
              {recentUsers.map((u) => {
                const busy = toggleActive.isPending && toggleActive.variables?._id === u._id;
                const isMe = u._id === myId;
                return (
                  <li key={u._id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">
                        {fullName(u)} {isMe ? <span className="text-xs font-normal text-slate-400">(you)</span> : null}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {u.email} · {humanize(u.role)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusChip label={u.isActive ? 'Active' : 'Suspended'} variant={u.isActive ? 'success' : 'danger'} />
                      <button
                        type="button"
                        disabled={busy || isMe}
                        onClick={() => toggleActive.mutate(u)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                        title={isMe ? 'You cannot suspend your own account' : undefined}
                      >
                        {busy ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : u.isActive ? (
                          <ShieldOff className="h-3.5 w-3.5 text-red-600" />
                        ) : (
                          <Shield className="h-3.5 w-3.5 text-emerald-600" />
                        )}
                        {u.isActive ? 'Suspend' : 'Activate'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {toggleActive.isError ? <p className="px-5 pb-4 text-sm text-red-600">{errorMessage(toggleActive.error)}</p> : null}
        </section>

        <section className="rounded-2xl border border-slate-100/80 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100/80 px-5 py-4">
            <h2 className="font-semibold text-slate-900">Recent activity</h2>
            <Link to="/audit-logs" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900">
              Audit log <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {audit.isLoading ? (
            <LoadingState className="rounded-none border-0" />
          ) : audit.isError ? (
            <ErrorState className="m-4" message={errorMessage(audit.error)} onRetry={() => audit.refetch()} />
          ) : (
            <ul className="divide-y divide-slate-50">
              {(audit.data?.data ?? []).map((ev) => (
                <li key={ev._id} className="px-5 py-3">
                  <p className={cn('text-sm text-slate-800')}>{describeAuditEvent(ev)}</p>
                  <p className="text-xs text-slate-500">
                    {fullName(ev.userId)} · {timeAgo(ev.createdAt)}
                  </p>
                </li>
              ))}
              {(audit.data?.data ?? []).length === 0 ? <li className="px-5 py-6 text-center text-sm text-slate-500">No activity yet.</li> : null}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
