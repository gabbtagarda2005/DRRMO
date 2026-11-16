import { useMemo, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Home, Route, Wheat } from 'lucide-react';
import { EmptyState, ErrorState, Field, LoadingState, Notice, PageTitleSync, StatusChip, inputClass } from '@drrmo/ui';
import { reportsApi, type AlertPriority } from '@shared/src/services';
import { errorMessage, formatDate, humanize } from '@shared/src/format';
import { useBarangay } from '../lib/useBarangay';
import { NoBarangay } from '../lib/NoBarangay';

const SECTORS = [
  { value: 'residential', label: 'Residential', icon: Home },
  { value: 'commercial', label: 'Commercial', icon: Building2 },
  { value: 'infrastructure', label: 'Roads & infrastructure', icon: Route },
  { value: 'agriculture', label: 'Agriculture / fisheries', icon: Wheat },
];

const SEVERITY_OPTIONS: { value: AlertPriority; label: string }[] = [
  { value: 'low', label: 'Minor — cosmetic, still usable' },
  { value: 'medium', label: 'Moderate — partially damaged' },
  { value: 'high', label: 'Severe — unsafe / unusable' },
  { value: 'critical', label: 'Destroyed / collapse risk' },
];

const severityVariant = { critical: 'danger', high: 'warning', medium: 'info', low: 'neutral' } as const;
const statusVariant = { pending: 'warning', reviewed: 'info', processed: 'success' } as const;

export function DamageAssessment() {
  const queryClient = useQueryClient();
  const { barangay, isLoading: loadingMe } = useBarangay();
  const [form, setForm] = useState({ sector: 'residential', structures: '', severity: 'medium' as AlertPriority, location: '', notes: '' });

  const submissions = useQuery({
    queryKey: ['reports', 'damage', barangay],
    queryFn: () => reportsApi.list({ type: 'damage_report' }),
    enabled: !!barangay,
  });

  const submit = useMutation({
    mutationFn: () => {
      const sector = SECTORS.find((s) => s.value === form.sector)!;
      return reportsApi.create({
        type: 'damage_report',
        title: `${sector.label} damage${form.location.trim() ? ` — ${form.location.trim()}` : ''}`,
        description: form.notes.trim(),
        severity: form.severity,
        details: { sector: form.sector, structures: Number(form.structures) || 0, location: form.location.trim() },
      });
    },
    onSuccess: () => {
      setForm({ sector: form.sector, structures: '', severity: 'medium', location: '', notes: '' });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const totals = useMemo(() => {
    const rows = submissions.data?.data ?? [];
    return SECTORS.map((s) => ({
      ...s,
      count: rows.filter((r) => r.details?.sector === s.value).reduce((sum, r) => sum + (Number(r.details?.structures) || 0), 0),
    }));
  }, [submissions.data]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    submit.mutate();
  };

  if (loadingMe) return <LoadingState />;

  return (
    <div className="space-y-6">
      <PageTitleSync title="Damage Assessment" />

      {!barangay ? (
        <NoBarangay />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-100/80 bg-white p-6 shadow-sm">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">New assessment</h2>
            <p className="mt-1 text-sm text-slate-600">Document damage within {barangay} for DRRMO validation and relief planning.</p>

            <form className="mt-6 space-y-4" onSubmit={onSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Affected sector">
                  <select value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className={inputClass}>
                    {SECTORS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Structures affected">
                  <input required type="number" min={0} value={form.structures} onChange={(e) => setForm({ ...form, structures: e.target.value })} placeholder="e.g. 12" className={inputClass} />
                </Field>
              </div>
              <Field label="Damage level">
                <select value={form.severity} onChange={(e) => setForm({ ...form, severity: e.target.value as AlertPriority })} className={inputClass}>
                  {SEVERITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Area / purok">
                <input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Purok 3, along the creek" className={inputClass} />
              </Field>
              <Field label="Field notes">
                <textarea
                  required
                  rows={4}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Extent of damage, access routes, immediate hazards…"
                  className={inputClass}
                />
              </Field>

              {submit.isSuccess ? <Notice tone="success">Assessment submitted to the DRRMO for review.</Notice> : null}
              {submit.isError ? <Notice tone="error">{errorMessage(submit.error)}</Notice> : null}

              <button
                type="submit"
                disabled={submit.isPending}
                className="w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
              >
                {submit.isPending ? 'Submitting…' : 'Submit to DRRMO'}
              </button>
            </form>
          </section>

          <section className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {totals.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.value} className="rounded-xl border border-slate-100/80 bg-white p-4 text-center shadow-sm">
                    <Icon className="mx-auto h-5 w-5 text-emerald-600" />
                    <p className="mt-2 text-lg font-bold text-slate-900">{item.count}</p>
                    <p className="text-xs text-slate-500">{item.label.split(' ')[0]}</p>
                  </div>
                );
              })}
            </div>

            <div className="rounded-2xl border border-slate-100/80 bg-white shadow-sm">
              <div className="border-b border-slate-100 px-6 py-4">
                <h2 className="font-semibold text-slate-900">Submissions</h2>
              </div>
              {submissions.isLoading ? (
                <LoadingState className="rounded-none border-0" />
              ) : submissions.isError ? (
                <ErrorState className="m-4" message={errorMessage(submissions.error)} onRetry={() => submissions.refetch()} />
              ) : (submissions.data?.data ?? []).length === 0 ? (
                <EmptyState className="m-4" title="No assessments yet" description="Your submitted damage assessments will be listed here." />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {submissions.data!.data.map((row) => (
                    <li key={row._id} className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{row.title}</p>
                        <p className="text-xs text-slate-500">
                          {String(row.details?.structures ?? 0)} structures · {formatDate(row.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <StatusChip label={humanize(row.severity)} variant={severityVariant[row.severity] ?? 'neutral'} />
                        <StatusChip label={humanize(row.status)} variant={statusVariant[row.status] ?? 'neutral'} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
