import { useMemo } from 'react';
import { Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, ArrowRight, ArrowUpRight, Building2, ClipboardList, Loader2, Shield, type LucideIcon } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, PageTitleSync, StatusChip, cn } from '@drrmo/ui';
import { evacuationsApi, incidentsApi, reportsApi, type IncidentRecord } from '@shared/src/services';
import { errorMessage, humanize, timeAgo } from '@shared/src/format';
import { useBarangay } from './lib/useBarangay';
import { NoBarangay } from './lib/NoBarangay';

const ACTIVE = ['reported', 'verified', 'responding', 'in_progress'];
const severityVariant = { critical: 'danger', high: 'warning', medium: 'info', low: 'neutral' } as const;

export function TacticalDashboard() {
  const queryClient = useQueryClient();
  const { barangay, isLoading: loadingMe, me } = useBarangay();

  const incidents = useQuery({
    queryKey: ['incidents', 'barangay', barangay],
    queryFn: () => incidentsApi.list({ barangay: barangay!, limit: 100 }),
    enabled: !!barangay,
    refetchInterval: 20_000,
  });
  const centers = useQuery({ queryKey: ['evacuations'], queryFn: evacuationsApi.list, enabled: !!barangay, refetchInterval: 20_000 });
  const pendingReports = useQuery({
    queryKey: ['reports', 'pending', barangay],
    queryFn: () => reportsApi.list({ status: 'pending', limit: 1 }),
    enabled: !!barangay,
  });

  const escalate = useMutation({
    mutationFn: (inc: IncidentRecord) => incidentsApi.escalate(String(inc._id)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incidents'] }),
  });

  const active = useMemo(() => (incidents.data?.data ?? []).filter((i) => ACTIVE.includes(i.status ?? '')), [incidents.data]);
  const localCenters = useMemo(() => (centers.data ?? []).filter((c) => c.barangay === barangay), [centers.data, barangay]);
  const shelter = useMemo(() => {
    const open = localCenters.filter((c) => c.status === 'operational');
    const cap = open.reduce((s, c) => s + c.capacity, 0);
    const occ = open.reduce((s, c) => s + c.currentOccupancy, 0);
    return { cap, occ, pct: cap ? Math.round((occ / cap) * 100) : 0 };
  }, [localCenters]);

  if (loadingMe) return <LoadingState />;
  if (!barangay) {
    return (
      <div className="space-y-6">
        <PageTitleSync title="Barangay Dashboard" />
        <NoBarangay />
      </div>
    );
  }

  const critical = active.filter((i) => i.severity === 'critical' || i.severity === 'high').length;

  return (
    <div className="space-y-6">
      <PageTitleSync title="Barangay Dashboard" />

      <div className="rounded-2xl border border-emerald-100/80 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">
          {barangay}
          {me ? ` · ${me.firstName} ${me.lastName}` : ''}
        </p>
        <p className="mt-1 text-sm text-slate-600">Local threats · shelter capacity · submissions awaiting DRRMO review</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <MetricRibbon label="Active incidents" value={incidents.isLoading ? '…' : active.length} tone="critical" icon={AlertTriangle} />
          <MetricRibbon label="High / critical" value={incidents.isLoading ? '…' : critical} tone="critical" icon={Shield} />
          <MetricRibbon label="Shelter utilisation" value={centers.isLoading ? '…' : `${shelter.pct}%`} tone="capacity" icon={Building2} />
          <MetricRibbon label="Pending submissions" value={pendingReports.data?.total ?? '…'} tone="pending" icon={ClipboardList} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="overflow-hidden rounded-2xl border border-slate-100/80 bg-white shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100/80 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">Active incident ledger</h2>
              <p className="mt-0.5 text-xs text-slate-500">Escalate urgent incidents to DRRMO command</p>
            </div>
            <Link to="/incidents" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900">
              All incidents <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {incidents.isLoading ? (
            <LoadingState className="rounded-none border-0" />
          ) : incidents.isError ? (
            <ErrorState className="m-4" message={errorMessage(incidents.error)} onRetry={() => incidents.refetch()} />
          ) : active.length === 0 ? (
            <EmptyState className="m-4" title="All clear" description={`No active incidents in ${barangay}.`} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50/80 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Incident</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {active.slice(0, 8).map((row) => {
                    const busy = escalate.isPending && escalate.variables?._id === row._id;
                    return (
                      <tr key={row._id} className="hover:bg-slate-50/60">
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-900">{row.title}</p>
                          <p className="line-clamp-1 text-xs text-slate-500">
                            {humanize(row.type)} · {row.location?.address} · {timeAgo(row.createdAt)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1.5">
                            <StatusChip label={humanize(row.severity)} variant={severityVariant[row.severity as keyof typeof severityVariant] ?? 'neutral'} />
                            <StatusChip label={humanize(row.status)} variant="neutral" />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            type="button"
                            disabled={row.escalated || busy}
                            onClick={() => escalate.mutate(row)}
                            className={cn(
                              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition',
                              row.escalated ? 'border-slate-200 bg-slate-50 text-slate-500' : 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100 disabled:opacity-50'
                            )}
                          >
                            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpRight className="h-3.5 w-3.5" />}
                            {row.escalated ? 'Escalated' : 'Escalate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          {escalate.isError ? <p className="px-5 pb-4 text-sm text-red-600">{errorMessage(escalate.error)}</p> : null}
        </section>

        <section className="rounded-2xl border border-slate-100/80 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">Safe-zone occupancy</h2>
            <Link to="/evacuations" className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900">
              Manage <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="mt-5 text-center">
            <p className="text-4xl font-bold tabular-nums text-slate-900">{shelter.occ.toLocaleString()}</p>
            <p className="text-sm text-slate-500">evacuees · {shelter.cap.toLocaleString()} capacity</p>
          </div>
          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn('h-full rounded-full transition-all', shelter.pct >= 95 ? 'bg-red-500' : shelter.pct >= 80 ? 'bg-amber-500' : 'bg-emerald-500')}
              style={{ width: `${Math.min(shelter.pct, 100)}%` }}
            />
          </div>
          <p className={cn('mt-3 text-center text-sm font-semibold', shelter.pct >= 95 ? 'text-red-600' : shelter.pct >= 80 ? 'text-amber-700' : 'text-emerald-700')}>
            {shelter.cap === 0 ? 'No open centers registered' : shelter.pct >= 95 ? 'Critical — open overflow shelter' : shelter.pct >= 80 ? 'Monitor intake closely' : 'Capacity available'}
          </p>
          <ul className="mt-5 space-y-3">
            {localCenters.map((c) => {
              const pct = c.capacity ? Math.round((c.currentOccupancy / c.capacity) * 100) : 0;
              return (
                <li key={c._id}>
                  <div className="flex justify-between text-xs">
                    <span className="truncate font-medium text-slate-700">{c.name}</span>
                    <span className="text-slate-500">
                      {c.currentOccupancy}/{c.capacity}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={cn('h-full rounded-full', pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${Math.min(pct, 100)}%` }} />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}

function MetricRibbon({ label, value, tone, icon: Icon }: { label: string; value: string | number; tone: 'critical' | 'capacity' | 'pending'; icon: LucideIcon }) {
  const tones = {
    critical: 'border-red-100 bg-red-50/80 text-red-800',
    capacity: 'border-amber-100 bg-amber-50/80 text-amber-900',
    pending: 'border-emerald-100 bg-emerald-50/80 text-emerald-900',
  };
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${tones[tone]}`}>
      <Icon className="h-5 w-5 shrink-0 opacity-80" />
      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{label}</p>
        <p className="text-lg font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}
