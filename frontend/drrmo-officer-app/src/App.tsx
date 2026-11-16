import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Activity,
  AlertTriangle,
  Ambulance,
  Building2,
  Loader2,
  Map,
  Radio,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { PageTitleSync, StatCard, StatusChip } from '@drrmo/ui';
import { apiGet } from '@shared/src/api';
import { IncidentMap } from './components/IncidentMap';
import { useIncidentRealtimeSync } from './hooks/useIncidentRealtimeSync';
import { useRealtime } from './app/providers/RealtimeProvider';
import {
  fetchIncidents,
  fetchIncidentStats,
  fetchResponders,
  verifyIncident,
  assignResponders,
} from './services/incidents';
import { fetchEvacuationSummary } from './services/evacuations';

const severityVariant: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'neutral'> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
};

export function TacticalDashboard() {
  useIncidentRealtimeSync();
  const { isConnected } = useRealtime();
  const queryClient = useQueryClient();
  const [selectedResponder, setSelectedResponder] = useState<string>('');

  const statsQuery = useQuery({ queryKey: ['incidents', 'stats'], queryFn: fetchIncidentStats, refetchInterval: 30_000 });
  const recentQuery = useQuery({ queryKey: ['incidents', { limit: 5 }], queryFn: () => fetchIncidents({ limit: 5 }) });
  const respondersQuery = useQuery({ queryKey: ['responders', 'all'], queryFn: () => fetchResponders() });
  const evacuationQuery = useQuery({ queryKey: ['evacuations', 'summary'], queryFn: fetchEvacuationSummary });
  const healthQuery = useQuery({
    queryKey: ['health'],
    queryFn: () => apiGet<{ status: string }>('/health'),
    refetchInterval: 15_000,
    retry: false,
  });

  const availableResponders = useMemo(
    () => (respondersQuery.data ?? []).filter((r) => r.status === 'available'),
    [respondersQuery.data],
  );
  const deployedResponders = useMemo(
    () => (respondersQuery.data ?? []).filter((r) => r.status === 'responding' || r.status === 'on_scene'),
    [respondersQuery.data],
  );

  const incidents = recentQuery.data?.data ?? [];
  const topIncident = incidents[0];

  const verifyMutation = useMutation({
    mutationFn: verifyIncident,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incidents'] }),
  });

  const assignMutation = useMutation({
    mutationFn: ({ id, responderIds }: { id: string; responderIds: string[] }) => assignResponders(id, responderIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      queryClient.invalidateQueries({ queryKey: ['responders'] });
    },
  });

  const activeCount = statsQuery.data
    ? (statsQuery.data.byStatus.reported ?? 0) +
      (statsQuery.data.byStatus.verified ?? 0) +
      (statsQuery.data.byStatus.responding ?? 0) +
      (statsQuery.data.byStatus.in_progress ?? 0)
    : undefined;
  const criticalCount = statsQuery.data?.bySeverity.critical ?? undefined;

  return (
    <div className="space-y-6">
      <PageTitleSync title="Command Dashboard" />

      <div className="rounded-2xl border border-blue-100/80 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
        <p className="text-sm font-medium text-blue-800">Provincial command center</p>
        <p className="mt-1 text-sm text-slate-600">Live incident feed · operations map · responder deployment</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Active incidents"
          value={activeCount ?? (statsQuery.isLoading ? '…' : '—')}
          icon={AlertTriangle}
        />
        <StatCard
          label="Critical severity"
          value={criticalCount ?? (statsQuery.isLoading ? '…' : '—')}
          icon={Radio}
        />
        <StatCard
          label="Responders available / deployed"
          value={
            respondersQuery.isLoading ? '…' : `${availableResponders.length} / ${deployedResponders.length}`
          }
          icon={Ambulance}
        />
        <StatCard
          label="Evacuation occupancy"
          value={
            evacuationQuery.isLoading || !evacuationQuery.data
              ? '…'
              : `${evacuationQuery.data.totalOccupancy} / ${evacuationQuery.data.totalCapacity}`
          }
          hint={evacuationQuery.data ? `${evacuationQuery.data.centers} centers` : undefined}
          icon={Building2}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        <div className="space-y-4 xl:col-span-3">
          <div className="flex flex-col gap-4 lg:flex-row">
            <section className="flex min-h-[320px] flex-1 flex-col rounded-2xl border border-slate-100/80 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100/80 px-5 py-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <h2 className="font-semibold text-slate-900">Recent incidents</h2>
                </div>
                <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-red-700 ring-1 ring-red-600/20">
                  {recentQuery.data?.total ?? 0} total
                </span>
              </div>
              {recentQuery.isLoading ? (
                <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading incidents…
                </div>
              ) : recentQuery.isError ? (
                <div className="flex flex-1 flex-col items-center justify-center gap-2 p-5 text-center text-sm text-red-600">
                  <p>Could not load incidents.</p>
                  <button type="button" className="text-xs font-semibold underline" onClick={() => recentQuery.refetch()}>
                    Retry
                  </button>
                </div>
              ) : incidents.length === 0 ? (
                <div className="flex flex-1 items-center justify-center p-5 text-sm text-slate-400">
                  No incidents reported yet.
                </div>
              ) : (
                <ul className="flex-1 overflow-y-auto px-5">
                  {incidents.map((incident) => (
                    <li key={incident._id} className="flex items-start justify-between gap-3 border-b border-slate-100/80 py-3 last:border-0">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 capitalize">{incident.title}</p>
                        <p className="text-xs text-slate-500 truncate">{incident.location.address}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{incident.location.barangay}</p>
                      </div>
                      <StatusChip label={incident.severity} variant={severityVariant[incident.severity] ?? 'neutral'} />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="flex min-h-[320px] flex-1 flex-col rounded-2xl border border-slate-100/80 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100/80 px-5 py-4">
                <div className="flex items-center gap-2">
                  <Map className="h-5 w-5 text-blue-900" />
                  <h2 className="font-semibold text-slate-900">Operations map</h2>
                </div>
                <Activity className="h-4 w-4 text-emerald-600 animate-pulse" />
              </div>
              <div className="flex-1">
                <IncidentMap incidents={incidents} heightClassName="h-full" />
              </div>
            </section>
          </div>

          {topIncident ? (
            <section className="rounded-2xl border border-slate-100/80 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase text-slate-500">Quick action · {topIncident.title}</p>
              <div className="mt-3 flex flex-wrap items-end gap-4">
                {topIncident.status === 'reported' ? (
                  <button
                    type="button"
                    onClick={() => verifyMutation.mutate(topIncident._id!)}
                    disabled={verifyMutation.isPending}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
                  >
                    {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    Verify incident
                  </button>
                ) : (
                  <>
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-xs font-bold uppercase text-slate-500">Assign responder</label>
                      <select
                        value={selectedResponder}
                        onChange={(e) => setSelectedResponder(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-800"
                      >
                        <option value="">Select a responder…</option>
                        {availableResponders.map((r) => (
                          <option key={r._id} value={r.userId._id}>
                            {r.userId.firstName} {r.userId.lastName} {r.team ? `· ${r.team}` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        selectedResponder &&
                        assignMutation.mutate({ id: topIncident._id!, responderIds: [selectedResponder] })
                      }
                      disabled={!selectedResponder || assignMutation.isPending}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-800 disabled:opacity-60"
                    >
                      {assignMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Ambulance className="h-4 w-4" />}
                      Assign responder
                    </button>
                  </>
                )}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-slate-100/80 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase text-slate-500">System health</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li className="flex items-center justify-between">
                <span className="text-slate-700">REST API</span>
                <span
                  className={`flex items-center gap-1 text-xs font-semibold ${
                    healthQuery.data?.status === 'OK' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      healthQuery.data?.status === 'OK' ? 'animate-pulse bg-emerald-500' : 'bg-red-500'
                    }`}
                  />
                  {healthQuery.isLoading ? 'Checking…' : healthQuery.data?.status === 'OK' ? 'OK' : 'Fault'}
                </span>
              </li>
              <li className="flex items-center justify-between">
                <span className="text-slate-700">Realtime channel</span>
                <span className={`flex items-center gap-1 text-xs font-semibold ${isConnected ? 'text-emerald-600' : 'text-red-600'}`}>
                  {isConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
                  {isConnected ? 'Connected' : 'Offline'}
                </span>
              </li>
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-100/80 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase text-slate-500">Incidents by severity</h3>
            <ul className="mt-3 space-y-1.5 text-sm">
              {['critical', 'high', 'medium', 'low'].map((severity) => (
                <li key={severity} className="flex items-center justify-between">
                  <span className="capitalize text-slate-700">{severity}</span>
                  <span className="font-semibold text-slate-900">{statsQuery.data?.bySeverity[severity] ?? 0}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-slate-100/80 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase text-slate-500">Incidents (last 12h)</h3>
            <div className="mt-3 flex h-24 items-end gap-1">
              {(statsQuery.data?.hourly ?? Array(12).fill(0)).map((count, i) => {
                const max = Math.max(...(statsQuery.data?.hourly ?? [1]), 1);
                const height = Math.max((count / max) * 100, count > 0 ? 8 : 2);
                return (
                  <div
                    key={i}
                    className="flex-1 rounded-t bg-blue-900/75 transition-all hover:bg-blue-800"
                    style={{ height: `${height}%` }}
                    title={`${count} incidents`}
                  />
                );
              })}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
