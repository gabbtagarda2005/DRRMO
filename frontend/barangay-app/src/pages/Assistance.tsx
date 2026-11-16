import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Droplets, HeartPulse, LifeBuoy, Package, Plus, Truck, type LucideIcon } from 'lucide-react';
import { EmptyState, ErrorState, Field, LoadingState, Modal, Notice, PageTitleSync, StatusChip, inputClass } from '@drrmo/ui';
import { reportsApi, type AlertPriority } from '@shared/src/services';
import { errorMessage, humanize, timeAgo } from '@shared/src/format';
import { useBarangay } from '../lib/useBarangay';
import { NoBarangay } from '../lib/NoBarangay';

const CATEGORIES: { value: string; label: string; icon: LucideIcon; unit: string }[] = [
  { value: 'rescue', label: 'Rescue', icon: LifeBuoy, unit: 'teams' },
  { value: 'relief', label: 'Relief goods', icon: Package, unit: 'families' },
  { value: 'medical', label: 'Medical', icon: HeartPulse, unit: 'patients' },
  { value: 'water', label: 'Water & sanitation', icon: Droplets, unit: 'gallons' },
  { value: 'transport', label: 'Transport / vehicles', icon: Truck, unit: 'vehicles' },
];

const priorityVariant = { critical: 'danger', high: 'warning', medium: 'info', low: 'neutral' } as const;
const statusVariant = { pending: 'neutral', reviewed: 'info', processed: 'success' } as const;
const statusLabel = { pending: 'Submitted', reviewed: 'Acknowledged', processed: 'Fulfilled' } as const;

export function Assistance() {
  const queryClient = useQueryClient();
  const { barangay, isLoading: loadingMe } = useBarangay();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: 'relief', quantity: '', priority: 'high' as AlertPriority, title: '', notes: '' });

  const requests = useQuery({
    queryKey: ['reports', 'assistance', barangay],
    queryFn: () => reportsApi.list({ type: 'resource_report' }),
    enabled: !!barangay,
    refetchInterval: 30_000,
  });

  const create = useMutation({
    mutationFn: () => {
      const cat = CATEGORIES.find((c) => c.value === form.category)!;
      return reportsApi.create({
        type: 'resource_report',
        title: form.title.trim() || `${cat.label} — ${form.quantity} ${cat.unit}`,
        description: form.notes.trim(),
        severity: form.priority,
        details: { category: form.category, quantity: Number(form.quantity) || 0, unit: cat.unit },
      });
    },
    onSuccess: () => {
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };

  if (loadingMe) return <LoadingState />;

  const unit = CATEGORIES.find((c) => c.value === form.category)?.unit ?? 'units';

  return (
    <div className="space-y-6">
      <PageTitleSync title="Assistance Requests" />

      {!barangay ? (
        <NoBarangay />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">Resource requests from {barangay} to the DRRMO, with live fulfilment status.</p>
            <button
              type="button"
              onClick={() => {
                create.reset();
                setForm({ category: 'relief', quantity: '', priority: 'high', title: '', notes: '' });
                setOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              New request
            </button>
          </div>

          {create.isSuccess ? <Notice tone="success">Request sent. You'll see its status change here as the DRRMO acts on it.</Notice> : null}

          {requests.isLoading ? (
            <LoadingState label="Loading requests…" />
          ) : requests.isError ? (
            <ErrorState message={errorMessage(requests.error)} onRetry={() => requests.refetch()} />
          ) : (requests.data?.data ?? []).length === 0 ? (
            <EmptyState title="No assistance requests yet" description="Request rescue teams, relief goods, medical support or vehicles from the DRRMO." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {requests.data!.data.map((req) => {
                const cat = CATEGORIES.find((c) => c.value === req.details?.category);
                const Icon = cat?.icon ?? Package;
                return (
                  <article key={req._id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-500">
                          {cat?.label ?? 'Request'} · {timeAgo(req.createdAt)}
                        </p>
                        <h3 className="font-semibold text-slate-900">{req.title}</h3>
                        {req.description ? <p className="mt-1 line-clamp-2 text-sm text-slate-600">{req.description}</p> : null}
                        <div className="mt-3 flex flex-wrap gap-2">
                          <StatusChip label={humanize(req.severity)} variant={priorityVariant[req.severity] ?? 'neutral'} />
                          <StatusChip label={statusLabel[req.status] ?? humanize(req.status)} variant={statusVariant[req.status] ?? 'neutral'} />
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal
        open={open}
        title="Request assistance"
        description="Sent directly to the DRRMO command center for action."
        onClose={() => setOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50">
              Cancel
            </button>
            <button type="submit" form="assist-form" disabled={create.isPending} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
              {create.isPending ? 'Sending…' : 'Send request'}
            </button>
          </>
        }
      >
        <form id="assist-form" onSubmit={submit} className="space-y-4">
          {create.isError ? <Notice tone="error">{errorMessage(create.error)}</Notice> : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={`Quantity (${unit})`}>
              <input required type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className={inputClass} />
            </Field>
          </div>
          <Field label="Priority">
            <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as AlertPriority })} className={inputClass}>
              <option value="critical">Critical — lives at immediate risk</option>
              <option value="high">High — needed within hours</option>
              <option value="medium">Medium — needed today</option>
              <option value="low">Low — planning / restock</option>
            </select>
          </Field>
          <Field label="Short title" hint="Optional. Defaults to category and quantity.">
            <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Rescue boat for Purok 3" className={inputClass} />
          </Field>
          <Field label="Details">
            <textarea required rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Who needs it, where to deliver, contact person…" className={inputClass} />
          </Field>
        </form>
      </Modal>
    </div>
  );
}
