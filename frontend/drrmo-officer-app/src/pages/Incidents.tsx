import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, ShieldCheck } from 'lucide-react';
import { PageTitleSync, StatusChip, cn } from '@drrmo/ui';
import { buildApiUrl } from '../services/api';
import { IncidentMap } from '../components/IncidentMap';
import { useIncidentRealtimeSync } from '../hooks/useIncidentRealtimeSync';
import {
  advanceIncidentStatus,
  assignResponders,
  fetchIncidents,
  fetchResponders,
  getNextStatuses,
  setIncidentPriority,
  verifyIncident,
  type Incident,
} from '../services/incidents';

const severityVariant: Record<string, 'danger' | 'warning' | 'info' | 'success' | 'neutral'> = {
  critical: 'danger',
  high: 'warning',
  medium: 'info',
  low: 'neutral',
};

export function Incidents() {
  useIncidentRealtimeSync();
  const queryClient = useQueryClient();

  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [priorityLevel, setPriorityLevel] = useState('medium');
  const [priorityReason, setPriorityReason] = useState('');
  const [nextStatus, setNextStatus] = useState('');
  const [selectedResponder, setSelectedResponder] = useState('');

  const filters = { status: statusFilter || undefined, severity: severityFilter || undefined, page, limit: 20 };
  const incidentsQuery = useQuery({ queryKey: ['incidents', filters], queryFn: () => fetchIncidents(filters) });
  const respondersQuery = useQuery({
    queryKey: ['responders', 'available'],
    queryFn: () => fetchResponders({ status: 'available' }),
  });

  const incidents = incidentsQuery.data?.data ?? [];
  const selected: Incident | undefined = incidents.find((i) => i._id === selectedId) ?? incidents[0];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['incidents'] });
    queryClient.invalidateQueries({ queryKey: ['responders'] });
  };

  const verifyMutation = useMutation({ mutationFn: verifyIncident, onSuccess: invalidate });
  const priorityMutation = useMutation({
    mutationFn: ({ id, level, reason }: { id: string; level: string; reason: string }) =>
      setIncidentPriority(id, level as any, reason),
    onSuccess: () => {
      invalidate();
      setPriorityReason('');
    },
  });
  const assignMutation = useMutation({
    mutationFn: ({ id, responderIds }: { id: string; responderIds: string[] }) => assignResponders(id, responderIds),
    onSuccess: () => {
      invalidate();
      setSelectedResponder('');
    },
  });
  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => advanceIncidentStatus(id, status),
    onSuccess: () => {
      invalidate();
      setNextStatus('');
    },
  });

  const nextStatuses = useMemo(() => (selected ? getNextStatuses(selected.status ?? 'reported') : []), [selected]);

  return (
    <div className="space-y-4">
      <PageTitleSync title="Incidents" />

      <div className="flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All statuses</option>
          {['reported', 'verified', 'responding', 'in_progress', 'resolved', 'closed'].map((s) => (
            <option key={s} value={s}>
              {s.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select
          value={severityFilter}
          onChange={(e) => {
            setSeverityFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="">All severities</option>
          {['low', 'medium', 'high', 'critical'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="grid min-h-[520px] gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-100 px-4 py-3 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Incident feed</h3>
            <span className="text-xs text-slate-400">{incidentsQuery.data?.total ?? 0} total</span>
          </div>

          {incidentsQuery.isLoading ? (
            <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading incidents…
            </div>
          ) : incidentsQuery.isError ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-5 text-center text-sm text-red-600">
              <p>Could not load incidents.</p>
              <button type="button" className="text-xs font-semibold underline" onClick={() => incidentsQuery.refetch()}>
                Retry
              </button>
            </div>
          ) : incidents.length === 0 ? (
            <div className="flex flex-1 items-center justify-center p-5 text-sm text-slate-400">
              No incidents match these filters.
            </div>
          ) : (
            <>
              <ul className="flex-1 overflow-y-auto divide-y divide-slate-50">
                {incidents.map((inc) => (
                  <li key={inc._id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(inc._id ?? null)}
                      className={cn(
                        'w-full px-4 py-3 text-left transition hover:bg-blue-50/50',
                        selected?._id === inc._id && 'bg-blue-50'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-slate-900">{inc.title}</span>
                        <StatusChip label={inc.severity} variant={severityVariant[inc.severity] ?? 'neutral'} />
                      </div>
                      <p className="mt-1 text-xs text-slate-500">
                        {(inc.status ?? 'reported').replace('_', ' ')} · {inc.location.barangay}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
              {incidentsQuery.data && incidentsQuery.data.totalPages > 1 ? (
                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-2 text-xs text-slate-500">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span>
                    Page {incidentsQuery.data.page} of {incidentsQuery.data.totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={page >= incidentsQuery.data.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              ) : null}
            </>
          )}
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col">
          <IncidentMap incidents={incidents} selectedId={selected?._id} onSelect={(i) => setSelectedId(i._id ?? null)} heightClassName="h-48" />

          {!selected ? (
            <div className="flex flex-1 items-center justify-center p-5 text-sm text-slate-400">Select an incident to view details.</div>
          ) : (
            <div className="flex-1 overflow-y-auto border-t border-slate-100 p-4 space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">{selected.title}</p>
                  <StatusChip label={(selected.status ?? 'reported').replace('_', ' ')} variant="info" />
                </div>
                <p className="mt-1 text-xs text-slate-500">{selected.description}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {selected.location.address} · {selected.location.barangay}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Affected: {selected.affectedCount ?? 0} · Injured: {selected.injuredCount ?? 0}
                </p>
                {selected.reportedBy ? (
                  <p className="mt-1 text-xs text-slate-400">
                    Reported by {selected.reportedBy.firstName} {selected.reportedBy.lastName}
                  </p>
                ) : null}
              </div>

              {selected.mediaUrls && selected.mediaUrls.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selected.mediaUrls.map((url) => (
                    <img key={url} src={buildApiUrl(url)} alt="Incident media" className="h-16 w-16 rounded-lg object-cover" />
                  ))}
                </div>
              ) : null}

              <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase text-slate-500">Priority</p>
                  <StatusChip
                    label={selected.priorityLevel ?? 'unset'}
                    variant={severityVariant[selected.priorityLevel ?? 'low'] ?? 'neutral'}
                  />
                </div>
                <p className="mt-1 text-xs text-slate-600">{selected.priorityReason}</p>
                {selected.priorityOverridden ? (
                  <p className="mt-1 text-[10px] font-semibold uppercase text-amber-600">Manually overridden</p>
                ) : null}
              </div>

              {selected.status === 'reported' ? (
                <button
                  type="button"
                  onClick={() => verifyMutation.mutate(selected._id!)}
                  disabled={verifyMutation.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-60"
                >
                  {verifyMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Verify incident
                </button>
              ) : null}

              <div className="space-y-2 rounded-xl border border-slate-100 p-3">
                <p className="text-xs font-bold uppercase text-slate-500">Change priority</p>
                <div className="flex gap-2">
                  <select
                    value={priorityLevel}
                    onChange={(e) => setPriorityLevel(e.target.value)}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  >
                    {['low', 'medium', 'high', 'critical'].map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
                <textarea
                  value={priorityReason}
                  onChange={(e) => setPriorityReason(e.target.value)}
                  placeholder="Reason for override (required)"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  rows={2}
                />
                <button
                  type="button"
                  disabled={!priorityReason.trim() || priorityMutation.isPending}
                  onClick={() => priorityMutation.mutate({ id: selected._id!, level: priorityLevel, reason: priorityReason })}
                  className="w-full rounded-xl bg-slate-800 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
                >
                  {priorityMutation.isPending ? 'Saving…' : 'Save priority override'}
                </button>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-100 p-3">
                <p className="text-xs font-bold uppercase text-slate-500">Assign responder</p>
                <select
                  value={selectedResponder}
                  onChange={(e) => setSelectedResponder(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm"
                >
                  <option value="">Select a responder…</option>
                  {(respondersQuery.data ?? []).map((r) => (
                    <option key={r._id} value={r.userId._id}>
                      {r.userId.firstName} {r.userId.lastName} {r.team ? `· ${r.team}` : ''}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedResponder || assignMutation.isPending}
                  onClick={() => assignMutation.mutate({ id: selected._id!, responderIds: [selectedResponder] })}
                  className="w-full rounded-xl bg-blue-900 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  {assignMutation.isPending ? 'Assigning…' : 'Dispatch responder'}
                </button>
              </div>

              {nextStatuses.length > 0 ? (
                <div className="space-y-2 rounded-xl border border-slate-100 p-3">
                  <p className="text-xs font-bold uppercase text-slate-500">Advance status</p>
                  <div className="flex gap-2">
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value)}
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    >
                      <option value="">Select next status…</option>
                      {nextStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!nextStatus || statusMutation.isPending}
                      onClick={() => statusMutation.mutate({ id: selected._id!, status: nextStatus })}
                      className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
                    >
                      {statusMutation.isPending ? '…' : 'Update'}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
