import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Download, FilePlus2, Filter, LogIn, Pencil, ShieldCheck, Trash2, type LucideIcon } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, PageTitleSync, cn, inputClass } from '@drrmo/ui';
import { auditApi } from '@shared/src/services';
import { downloadCsv, errorMessage, formatDateTime, fullName, humanize, timeAgo, todayStamp } from '@shared/src/format';
import { AUDIT_ACTIONS, describeAuditEvent } from '../lib/audit';

const RESOURCE_TYPES = ['Auth', 'User', 'Incident', 'EvacuationCenter', 'Resource', 'Responder', 'Notification', 'Report', 'Barangay'];

const ACTION_ICON: Record<string, LucideIcon> = {
  login: LogIn,
  create: FilePlus2,
  update: Pencil,
  delete: Trash2,
  verify: ShieldCheck,
};

const ACTION_TONE: Record<string, string> = {
  login: 'bg-sky-50 text-sky-700',
  create: 'bg-emerald-50 text-emerald-700',
  update: 'bg-amber-50 text-amber-700',
  delete: 'bg-red-50 text-red-700',
  verify: 'bg-indigo-50 text-indigo-700',
};

const PAGE_SIZE = 25;

export function AuditLogs() {
  const [action, setAction] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState(false);

  const logs = useQuery({
    queryKey: ['audit', { action, resourceType, page }],
    queryFn: () => auditApi.list({ action: action || undefined, resourceType: resourceType || undefined, page, limit: PAGE_SIZE }),
    placeholderData: keepPreviousData,
    refetchInterval: 30_000,
  });

  const exportCsv = async () => {
    setExporting(true);
    try {
      const all = await auditApi.list({ action: action || undefined, resourceType: resourceType || undefined, limit: 200 });
      downloadCsv(
        `drrmo-audit-log-${todayStamp()}`,
        all.data.map((ev) => ({
          Time: formatDateTime(ev.createdAt),
          Actor: fullName(ev.userId),
          'Actor email': ev.userId?.email ?? '',
          'Actor role': humanize(ev.userId?.role),
          Action: ev.action,
          Resource: ev.resourceType,
          'Resource ID': ev.resourceId,
          Summary: describeAuditEvent(ev),
        }))
      );
    } finally {
      setExporting(false);
    }
  };

  const data = logs.data;

  return (
    <div className="space-y-6">
      <PageTitleSync title="Audit Logs" />

      <div className="flex flex-wrap items-center gap-3">
        <Filter className="h-4 w-4 text-slate-400" />
        <select
          value={action}
          onChange={(e) => {
            setAction(e.target.value);
            setPage(1);
          }}
          className={cn(inputClass, "w-auto")}
        >
          <option value="">All actions</option>
          {AUDIT_ACTIONS.map((a) => (
            <option key={a} value={a}>
              {humanize(a)}
            </option>
          ))}
        </select>
        <select
          value={resourceType}
          onChange={(e) => {
            setResourceType(e.target.value);
            setPage(1);
          }}
          className={cn(inputClass, "w-auto")}
        >
          <option value="">All resources</option>
          {RESOURCE_TYPES.map((r) => (
            <option key={r} value={r}>
              {humanize(r.replace(/([a-z])([A-Z])/g, '$1 $2'))}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={exportCsv}
          disabled={exporting || !data || data.total === 0}
          className="ml-auto inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'Preparing…' : 'Export CSV'}
        </button>
      </div>

      {logs.isLoading ? (
        <LoadingState label="Loading audit trail…" />
      ) : logs.isError ? (
        <ErrorState message={errorMessage(logs.error)} onRetry={() => logs.refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState title="No audit events" description="Nothing matches these filters yet. Every sign-in and change is recorded here automatically." />
      ) : (
        <>
          <ul className={cn('space-y-2 transition-opacity', logs.isFetching && 'opacity-70')}>
            {data.data.map((ev) => {
              const Icon = ACTION_ICON[ev.action] ?? Pencil;
              return (
                <li key={ev._id} className="flex flex-wrap items-start gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
                  <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', ACTION_TONE[ev.action] ?? 'bg-slate-100 text-slate-600')}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900">{describeAuditEvent(ev)}</p>
                    <p className="text-sm text-slate-500">
                      {fullName(ev.userId)}
                      {ev.userId?.role ? ` · ${humanize(ev.userId.role)}` : ''}
                      {ev.userId?.email ? ` · ${ev.userId.email}` : ''}
                    </p>
                  </div>
                  <time className="text-xs text-slate-500" title={formatDateTime(ev.createdAt)} dateTime={ev.createdAt}>
                    {timeAgo(ev.createdAt)}
                  </time>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between text-sm text-slate-600">
            <p>
              Page {data.page} of {Math.max(data.totalPages, 1)} · {data.total} events
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
