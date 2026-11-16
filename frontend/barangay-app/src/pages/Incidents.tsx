import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowUpRight, Crosshair, MapPin, Plus } from 'lucide-react';
import { EmptyState, ErrorState, Field, LoadingState, Modal, Notice, PageTitleSync, StatusChip, cn, inputClass } from '@drrmo/ui';
import { incidentsApi, type IncidentRecord } from '@shared/src/services';
import { MAP_CONFIG } from '@shared/constants';
import { errorMessage, formatDateTime, fullName, humanize, timeAgo } from '@shared/src/format';
import { useBarangay } from '../lib/useBarangay';
import { NoBarangay } from '../lib/NoBarangay';

const TYPES = ['flood', 'fire', 'earthquake', 'landslide', 'typhoon', 'accident', 'other'];
const SEVERITIES = ['low', 'medium', 'high', 'critical'];
const severityVariant = { critical: 'danger', high: 'warning', medium: 'info', low: 'neutral' } as const;
const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  reported: 'warning',
  verified: 'info',
  responding: 'danger',
  in_progress: 'danger',
  resolved: 'success',
  closed: 'neutral',
};

const emptyDraft = () => ({
  title: '',
  description: '',
  type: 'flood',
  severity: 'medium',
  address: '',
  latitude: String(MAP_CONFIG.DEFAULT_CENTER.lat),
  longitude: String(MAP_CONFIG.DEFAULT_CENTER.lng),
  affectedCount: '0',
  injuredCount: '0',
});

export function Incidents() {
  const queryClient = useQueryClient();
  const { barangay, isLoading: loadingMe } = useBarangay();
  const [view, setView] = useState<'active' | 'all'>('active');
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [locating, setLocating] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const incidents = useQuery({
    queryKey: ['incidents', 'barangay', barangay],
    queryFn: () => incidentsApi.list({ barangay: barangay!, limit: 100 }),
    enabled: !!barangay,
    refetchInterval: 20_000,
  });

  const escalate = useMutation({
    mutationFn: (inc: IncidentRecord) => incidentsApi.escalate(String(inc._id)),
    onSuccess: (saved) => {
      setFlash(`“${saved.title}” was escalated to the DRRMO command center.`);
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });

  const create = useMutation({
    mutationFn: () =>
      incidentsApi.create({
        title: draft.title.trim(),
        description: draft.description.trim(),
        type: draft.type,
        severity: draft.severity,
        location: { latitude: Number(draft.latitude), longitude: Number(draft.longitude), address: draft.address.trim(), barangay: barangay! },
        affectedCount: Number(draft.affectedCount) || 0,
        injuredCount: Number(draft.injuredCount) || 0,
      }),
    onSuccess: (saved) => {
      setCreating(false);
      setFlash(`Reported “${saved.title}”. The DRRMO command center has been notified.`);
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    },
  });

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDraft((d) => ({ ...d, latitude: pos.coords.latitude.toFixed(6), longitude: pos.coords.longitude.toFixed(6) }));
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 }
    );
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };

  if (loadingMe) return <LoadingState />;
  if (!barangay) {
    return (
      <div className="space-y-6">
        <PageTitleSync title="Report Incident" />
        <NoBarangay />
      </div>
    );
  }

  const rows = (incidents.data?.data ?? []).filter((i) => view === 'all' || !['resolved', 'closed'].includes(i.status ?? ''));

  return (
    <div className="space-y-6">
      <PageTitleSync title="Report Incident" />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-600">
          Incidents in <strong>{barangay}</strong>. Report new incidents and escalate urgent ones to the DRRMO command center.
        </p>
        <button
          type="button"
          onClick={() => {
            create.reset();
            setDraft(emptyDraft());
            setCreating(true);
          }}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Report incident
        </button>
      </div>

      {flash ? (
        <Notice tone="success" onDismiss={() => setFlash(null)}>
          {flash}
        </Notice>
      ) : null}
      {escalate.isError ? <Notice tone="error">{errorMessage(escalate.error)}</Notice> : null}

      <div className="flex gap-1 self-start rounded-xl bg-slate-100 p-1">
        {(['active', 'all'] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition', view === v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800')}
          >
            {v === 'active' ? 'Active' : 'All incidents'}
          </button>
        ))}
      </div>

      {incidents.isLoading ? (
        <LoadingState label="Loading incidents…" />
      ) : incidents.isError ? (
        <ErrorState message={errorMessage(incidents.error)} onRetry={() => incidents.refetch()} />
      ) : rows.length === 0 ? (
        <EmptyState title={view === 'active' ? 'No active incidents' : 'No incidents recorded'} description={`Nothing is currently reported in ${barangay}.`} />
      ) : (
        <ul className="space-y-3">
          {rows.map((inc) => {
            const busy = escalate.isPending && escalate.variables?._id === inc._id;
            return (
              <li key={inc._id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{inc.title}</h3>
                      <StatusChip label={humanize(inc.severity)} variant={severityVariant[inc.severity as keyof typeof severityVariant] ?? 'neutral'} />
                      <StatusChip label={humanize(inc.status)} variant={statusVariant[inc.status ?? 'reported'] ?? 'neutral'} />
                      {inc.escalated ? <StatusChip label="Escalated" variant="success" /> : null}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{inc.description}</p>
                    <p className="mt-2 text-xs text-slate-500" title={formatDateTime(inc.createdAt)}>
                      {humanize(inc.type)} · reported by {fullName(inc.reportedBy)} · {timeAgo(inc.createdAt)}
                      {inc.affectedCount ? ` · ${inc.affectedCount} affected` : ''}
                      {inc.injuredCount ? ` · ${inc.injuredCount} injured` : ''}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                      <MapPin className="h-3.5 w-3.5" />
                      {inc.location?.address}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={inc.escalated || busy || ['resolved', 'closed'].includes(inc.status ?? '')}
                    onClick={() => escalate.mutate(inc)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-xl px-4 py-2 text-sm font-medium transition',
                      inc.escalated ? 'cursor-default bg-slate-100 text-slate-500' : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50'
                    )}
                  >
                    <ArrowUpRight className="h-4 w-4" />
                    {inc.escalated ? 'Sent to DRRMO' : busy ? 'Escalating…' : 'Escalate'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <Modal
        open={creating}
        size="lg"
        title="Report an incident"
        description={`Creates a live incident in ${barangay} visible to the DRRMO command center.`}
        onClose={() => setCreating(false)}
        footer={
          <>
            <button type="button" onClick={() => setCreating(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" form="incident-form" disabled={create.isPending} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              {create.isPending ? 'Submitting…' : 'Submit report'}
            </button>
          </>
        }
      >
        <form id="incident-form" onSubmit={submit} className="space-y-4">
          {create.isError ? <Notice tone="error">{errorMessage(create.error)}</Notice> : null}
          <Field label="What happened?">
            <input required maxLength={140} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="e.g. Flooding along Rizal Ave." className={inputClass} />
          </Field>
          <Field label="Details">
            <textarea required rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Situation, hazards, people needing help…" className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Type">
              <select value={draft.type} onChange={(e) => setDraft({ ...draft, type: e.target.value })} className={inputClass}>
                {TYPES.map((t) => (
                  <option key={t} value={t}>
                    {humanize(t)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Severity">
              <select value={draft.severity} onChange={(e) => setDraft({ ...draft, severity: e.target.value })} className={inputClass}>
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {humanize(s)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="Exact location / landmark">
            <input required value={draft.address} onChange={(e) => setDraft({ ...draft, address: e.target.value })} placeholder="Street, purok or nearby landmark" className={inputClass} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <Field label="Latitude">
              <input required type="number" step="any" min={-90} max={90} value={draft.latitude} onChange={(e) => setDraft({ ...draft, latitude: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Longitude">
              <input required type="number" step="any" min={-180} max={180} value={draft.longitude} onChange={(e) => setDraft({ ...draft, longitude: e.target.value })} className={inputClass} />
            </Field>
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="inline-flex h-[42px] items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              <Crosshair className="h-4 w-4" />
              {locating ? 'Locating…' : 'Use my location'}
            </button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="People affected">
              <input type="number" min={0} value={draft.affectedCount} onChange={(e) => setDraft({ ...draft, affectedCount: e.target.value })} className={inputClass} />
            </Field>
            <Field label="Injured">
              <input type="number" min={0} value={draft.injuredCount} onChange={(e) => setDraft({ ...draft, injuredCount: e.target.value })} className={inputClass} />
            </Field>
          </div>
        </form>
      </Modal>
    </div>
  );
}
