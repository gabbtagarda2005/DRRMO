import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ClipboardCheck, FileBarChart } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, Notice, PageTitleSync, ReportCenter, StatusChip, cn } from '@drrmo/ui';
import { reportsApi, type ReportRecord, type ReportStatus } from '@shared/src/services';
import { evacuationSummary, fieldSubmissions, incidentRegister, resourceInventory, responderRoster } from '@shared/src/exports';
import { errorMessage, formatDateTime, fullName, humanize, timeAgo } from '@shared/src/format';

const severityVariant = { critical: 'danger', high: 'warning', medium: 'info', low: 'neutral' } as const;
const statusVariant = { pending: 'warning', reviewed: 'info', processed: 'success' } as const;
const NEXT: Record<ReportStatus, ReportStatus | null> = { pending: 'reviewed', reviewed: 'processed', processed: null };

function detailLine(r: ReportRecord): string | null {
  const d = r.details ?? {};
  if (r.type === 'damage_report' && d.structures !== undefined) return `${humanize(String(d.sector ?? ''))} · ${d.structures} structures`;
  if (r.type === 'resource_report' && d.quantity !== undefined) return `${humanize(String(d.category ?? ''))} · ${d.quantity} ${d.unit ?? ''}`.trim();
  return null;
}

export function Reports() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ReportStatus | 'all'>('pending');

  const reports = useQuery({
    queryKey: ['reports', tab],
    queryFn: () => reportsApi.list(tab === 'all' ? {} : { status: tab }),
    refetchInterval: 30_000,
  });
  const pendingCount = useQuery({ queryKey: ['reports', 'pending-count'], queryFn: () => reportsApi.list({ status: 'pending', limit: 1 }) });

  const advance = useMutation({
    mutationFn: ({ id, status }: { id: string; status: ReportStatus }) => reportsApi.setStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reports'] }),
  });

  return (
    <div className="space-y-8">
      <PageTitleSync title="Reports" />

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">Barangay submissions</h2>
              <p className="text-sm text-slate-500">
                Damage assessments and assistance requests · {pendingCount.data?.total ?? '…'} awaiting review
              </p>
            </div>
          </div>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            {(['pending', 'reviewed', 'processed', 'all'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition', tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {advance.isError ? <Notice tone="error">{errorMessage(advance.error)}</Notice> : null}

        {reports.isLoading ? (
          <LoadingState />
        ) : reports.isError ? (
          <ErrorState message={errorMessage(reports.error)} onRetry={() => reports.refetch()} />
        ) : (reports.data?.data ?? []).length === 0 ? (
          <EmptyState title={tab === 'pending' ? 'Review queue is clear' : 'No submissions here'} description="New damage assessments and assistance requests from barangays will appear here." />
        ) : (
          <ul className="space-y-3">
            {reports.data!.data.map((r) => {
              const next = NEXT[r.status];
              const busy = advance.isPending && advance.variables?.id === r._id;
              const detail = detailLine(r);
              return (
                <li key={r._id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusChip label={r.type === 'resource_report' ? 'Assistance request' : humanize(r.type)} variant="neutral" />
                        <StatusChip label={humanize(r.severity)} variant={severityVariant[r.severity] ?? 'neutral'} />
                        <StatusChip label={humanize(r.status)} variant={statusVariant[r.status] ?? 'neutral'} />
                      </div>
                      <h3 className="mt-2 font-semibold text-slate-900">{r.title}</h3>
                      <p className="mt-1 text-sm text-slate-600">{r.description}</p>
                      <p className="mt-2 text-xs text-slate-500" title={formatDateTime(r.createdAt)}>
                        {r.barangay ?? 'Unknown barangay'} · {fullName(r.submittedBy)} · {timeAgo(r.createdAt)}
                        {detail ? ` · ${detail}` : ''}
                      </p>
                    </div>
                    {next ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => advance.mutate({ id: r._id, status: next })}
                        className="rounded-xl bg-blue-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                      >
                        {busy ? 'Updating…' : next === 'reviewed' ? 'Mark reviewed' : 'Mark processed'}
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-900">
            <FileBarChart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-semibold text-slate-900">Generate reports</h2>
            <p className="text-sm text-slate-500">Built from live records; downloads as CSV for Excel or Google Sheets.</p>
          </div>
        </div>
        <ReportCenter
          accentClass="bg-blue-900 hover:bg-blue-800"
          reports={[incidentRegister, evacuationSummary, resourceInventory, responderRoster, fieldSubmissions]}
        />
      </section>
    </div>
  );
}
