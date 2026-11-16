import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Download, MapPin } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, PageTitleSync, StatusChip, cn, inputClass } from '@drrmo/ui';
import { incidentsApi, barangaysApi } from '@shared/src/services';
import { incidentRegister } from '@shared/src/exports';
import { errorMessage, formatDateTime, fullName, humanize, timeAgo } from '@shared/src/format';

const STATUSES = ['reported', 'verified', 'responding', 'in_progress', 'resolved', 'closed'];
const SEVERITIES = ['critical', 'high', 'medium', 'low'];
const TYPES = ['flood', 'fire', 'earthquake', 'landslide', 'typhoon', 'accident', 'other'];

const severityVariant = { critical: 'danger', high: 'warning', medium: 'info', low: 'neutral' } as const;
const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  reported: 'warning',
  verified: 'info',
  responding: 'danger',
  in_progress: 'danger',
  resolved: 'success',
  closed: 'neutral',
};

const PAGE_SIZE = 20;

export function Incidents() {
  const [filters, setFilters] = useState({ status: '', severity: '', type: '', barangay: '' });
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const query = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
  const incidents = useQuery({
    queryKey: ['incidents', query, page],
    queryFn: () => incidentsApi.list({ ...query, page, limit: PAGE_SIZE }),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });
  const barangays = useQuery({ queryKey: ['barangays'], queryFn: barangaysApi.list, staleTime: 10 * 60_000 });

  const setFilter = (key: keyof typeof filters, value: string) => {
    setFilters((f) => ({ ...f, [key]: value }));
    setPage(1);
  };

  const data = incidents.data;

  return (
    <div className="space-y-6">
      <PageTitleSync title="Incidents" />

      <p className="text-sm text-slate-600">
        Read-only municipal incident register. Verification, dispatch and status changes are handled in the DRRMO Officer command center.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <select value={filters.status} onChange={(e) => setFilter('status', e.target.value)} className={cn(inputClass, "w-auto")}>
          <option value="">Any status</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {humanize(s)}
            </option>
          ))}
        </select>
        <select value={filters.severity} onChange={(e) => setFilter('severity', e.target.value)} className={cn(inputClass, "w-auto")}>
          <option value="">Any severity</option>
          {SEVERITIES.map((s) => (
            <option key={s} value={s}>
              {humanize(s)}
            </option>
          ))}
        </select>
        <select value={filters.type} onChange={(e) => setFilter('type', e.target.value)} className={cn(inputClass, "w-auto")}>
          <option value="">Any type</option>
          {TYPES.map((t) => (
            <option key={t} value={t}>
              {humanize(t)}
            </option>
          ))}
        </select>
        <select value={filters.barangay} onChange={(e) => setFilter('barangay', e.target.value)} className={cn(inputClass, "w-auto")}>
          <option value="">All barangays</option>
          {(barangays.data ?? []).map((b) => (
            <option key={b._id} value={b.name}>
              {b.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={exporting}
          onClick={async () => {
            setExporting(true);
            try {
              await incidentRegister.run();
            } finally {
              setExporting(false);
            }
          }}
          className="ml-auto inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Preparing…' : 'Export all'}
        </button>
      </div>

      {incidents.isLoading ? (
        <LoadingState label="Loading incidents…" />
      ) : incidents.isError ? (
        <ErrorState message={errorMessage(incidents.error)} onRetry={() => incidents.refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState title="No incidents found" description="No incidents match these filters." />
      ) : (
        <>
          <div className={cn('overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-opacity', incidents.isFetching && 'opacity-70')}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Incident</th>
                    <th className="px-4 py-3">Location</th>
                    <th className="px-4 py-3">Severity</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Casualties</th>
                    <th className="px-4 py-3">Reported</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.data.map((i) => (
                    <tr key={i._id} className="align-top hover:bg-slate-50/80">
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900">{i.title}</p>
                        <p className="text-xs text-slate-500">
                          {humanize(i.type)} · by {fullName(i.reportedBy)}
                          {i.escalated ? ' · escalated by barangay' : ''}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <p className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {i.location?.barangay}
                        </p>
                        <p className="max-w-[220px] truncate text-xs text-slate-500">{i.location?.address}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip label={humanize(i.severity)} variant={severityVariant[i.severity as keyof typeof severityVariant] ?? 'neutral'} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusChip label={humanize(i.status)} variant={statusVariant[i.status ?? 'reported'] ?? 'neutral'} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {i.affectedCount ?? 0} affected · {i.injuredCount ?? 0} injured
                      </td>
                      <td className="px-4 py-3 text-slate-600" title={formatDateTime(i.createdAt)}>
                        {timeAgo(i.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-600">
            <p>
              Page {data.page} of {Math.max(data.totalPages, 1)} · {data.total} incidents
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Newer
              </button>
              <button
                type="button"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 hover:bg-slate-50 disabled:opacity-40"
              >
                Older <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
